/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { ResourceAttributeSource, SpanAttributesSource } from './attributes'
import type { BackgroundingListener } from './backgrounding-listener'
import { BatchProcessor } from './batch-processor'
import type { Clock } from './clock'
import type { Configuration, CoreSchema } from './config'
import { schema, validateConfig } from './config'
import type { DeliveryFactory } from './delivery'
import { TracePayloadEncoder } from './delivery'
import FixedProbabilityManager from './fixed-probability-manager'
import type { IdGenerator } from './id-generator'
import type { NetworkSpan, NetworkSpanEndOptions, NetworkSpanOptions } from './network-span'
import type { Persistence } from './persistence'
import type { Plugin } from './plugin'
import ProbabilityFetcher from './probability-fetcher'
import ProbabilityManager from './probability-manager'
import { BufferingProcessor } from './processor'
import type { RetryQueueFactory } from './retry-queue'
import Sampler from './sampler'
import type { Span, SpanOptions } from './span'
import type { SpanContext, SpanContextStorage } from './span-context'
import { DefaultSpanContextStorage } from './span-context'
import { SpanFactory } from './span-factory'
import type { SpanFactoryConstructor } from './span-factory'
import { timeToNumber } from './time'

interface Constructor<T> { new(): T, prototype: T }

export type AppState = 'starting' | 'navigating' | 'settling' | 'ready'
export type SetAppState = (appState: AppState) => void

export interface Client<C extends Configuration> {
  appState: AppState
  start: (config: C | string) => void
  startSpan: (name: string, options?: SpanOptions) => Span
  startNetworkSpan: (options: NetworkSpanOptions) => NetworkSpan
  readonly currentSpanContext: SpanContext | undefined
  getPlugin: <T extends Plugin<C>> (Constructor: Constructor<T>) => T | undefined
}

export interface ClientOptions<S extends CoreSchema, C extends Configuration, T> {
  clock: Clock
  idGenerator: IdGenerator
  deliveryFactory: DeliveryFactory
  backgroundingListener: BackgroundingListener
  resourceAttributesSource: ResourceAttributeSource<C>
  spanAttributesSource: SpanAttributesSource<C>
  schema: S
  plugins: (spanFactory: SpanFactory<C>, spanContextStorage: SpanContextStorage, setAppState: SetAppState, appState: AppState) => Array<Plugin<C>>
  persistence: Persistence
  retryQueueFactory: RetryQueueFactory
  spanContextStorage?: SpanContextStorage
  spanFactory?: SpanFactoryConstructor<C>
  platformExtensions?: (spanFactory: SpanFactory<C>, spanContextStorage: SpanContextStorage) => T
}

export type BugsnagPerformance <C extends Configuration, T> = Client<C> & T

export function createClient<S extends CoreSchema, C extends Configuration, T> (options: ClientOptions<S, C, T>): BugsnagPerformance<C, T> {
  const bufferingProcessor = new BufferingProcessor()
  const spanContextStorage = options.spanContextStorage || new DefaultSpanContextStorage(options.backgroundingListener)
  let logger = options.schema.logger.defaultValue
  let appState: AppState = 'starting'
  const sampler = new Sampler(1.0)

  const SpanFactoryClass = options.spanFactory || SpanFactory

  const spanFactory = new SpanFactoryClass(
    bufferingProcessor,
    sampler,
    options.idGenerator,
    options.spanAttributesSource,
    options.clock,
    options.backgroundingListener,
    logger,
    spanContextStorage
  )
  const setAppState = (state: AppState) => {
    appState = state
  }
  const plugins = options.plugins(spanFactory, spanContextStorage, setAppState, appState)

  return {
    start: (config: C | string) => {
      const configuration = validateConfig<S, C>(config, options.schema)

      // if using the default endpoint add the API key as a subdomain
      // e.g. convert URL https://otlp.bugsnag.com/v1/traces to URL https://<project_api_key>.otlp.bugsnag.com/v1/traces
      if (configuration.endpoint === schema.endpoint.defaultValue) {
        configuration.endpoint = configuration.endpoint.replace('https://', `https://${configuration.apiKey}.`)
      }

      // Correlate errors with span by monkey patching _notify on the error client
      // and utilizing the setTraceCorrelation method on the event
      if (configuration.bugsnag && typeof configuration.bugsnag.Event.prototype.setTraceCorrelation === 'function' && configuration.bugsnag.Client) {
        const originalNotify = configuration.bugsnag.Client.prototype._notify
        configuration.bugsnag.Client.prototype._notify = function (...args) {
          const currentSpanContext = spanContextStorage.current
          if (currentSpanContext && typeof args[0].setTraceCorrelation === 'function') {
            args[0].setTraceCorrelation(currentSpanContext.traceId, currentSpanContext.id)
          }
          originalNotify.apply(this, args)
        }
      }

      const delivery = options.deliveryFactory(configuration.endpoint)

      options.spanAttributesSource.configure(configuration)

      spanFactory.configure(configuration)

      const probabilityManagerPromise = configuration.samplingProbability === undefined
        ? ProbabilityManager.create(
          options.persistence,
          sampler,
          new ProbabilityFetcher(delivery, configuration.apiKey)
        )
        : FixedProbabilityManager.create(sampler, configuration.samplingProbability)

      probabilityManagerPromise.then((manager: ProbabilityManager | FixedProbabilityManager) => {
        const batchProcessor = new BatchProcessor(
          delivery,
          configuration,
          options.retryQueueFactory(delivery, configuration.retryQueueMaxSize),
          sampler,
          manager,
          new TracePayloadEncoder(options.clock, configuration, options.resourceAttributesSource)
        )

        spanFactory.reprocessEarlySpans(batchProcessor)

        // register with the backgrounding listener - we do this in 'start' as
        // there's nothing to do if we're backgrounded before start is called
        // e.g. we can't trigger delivery until we have the apiKey and endpoint
        // from configuration
        options.backgroundingListener.onStateChange(state => {
          batchProcessor.flush()

          // ensure we have a fresh probability value when returning to the
          // foreground
          if (state === 'in-foreground') {
            manager.ensureFreshProbability()
          }
        })

        logger = configuration.logger
      })

      for (const plugin of configuration.plugins) {
        plugins.push(plugin as unknown as Plugin<C>)
      }

      for (const plugin of plugins) {
        plugin.configure(configuration, spanFactory, setAppState, appState)
      }
    },
    startSpan: (name, spanOptions?: SpanOptions) => {
      const cleanOptions = spanFactory.validateSpanOptions(name, spanOptions)
      const span = spanFactory.startSpan(cleanOptions.name, cleanOptions.options)
      span.setAttribute('bugsnag.span.category', 'custom')
      return spanFactory.toPublicApi(span)
    },
    startNetworkSpan: (networkSpanOptions: NetworkSpanOptions) => {
      const spanInternal = spanFactory.startNetworkSpan(networkSpanOptions)
      const span = spanFactory.toPublicApi(spanInternal)

      // Overwrite end method to set status code attribute
      // once we release the setAttribute API we can simply return the span
      const networkSpan: NetworkSpan = {
        ...span,
        end: (endOptions: NetworkSpanEndOptions) => {
          spanFactory.endSpan(
            spanInternal,
            timeToNumber(options.clock, endOptions.endTime),
            { 'http.status_code': endOptions.status }
          )
        }
      }

      return networkSpan
    },
    getPlugin: (Constructor) => {
      for (const plugin of plugins) {
        if (plugin instanceof Constructor) {
          return plugin
        }
      }
    },
    get currentSpanContext () {
      return spanContextStorage.current
    },
    get appState () {
      return appState
    },
    ...(options.platformExtensions && options.platformExtensions(spanFactory, spanContextStorage))
  } as BugsnagPerformance<C, T>
}

export function createNoopClient<C extends Configuration, T> (): BugsnagPerformance<C, T> {
  const noop = () => {}

  return {
    start: noop,
    startSpan: () => ({ id: '', traceId: '', end: noop, isValid: () => false }),
    currentSpanContext: undefined
  } as unknown as BugsnagPerformance<C, T>
}
