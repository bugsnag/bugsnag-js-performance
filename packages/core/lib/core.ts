import { type ResourceAttributeSource, type SpanAttributesSource } from './attributes'
import { type BackgroundingListener } from './backgrounding-listener'
import { BatchProcessor } from './batch-processor'
import { type Clock } from './clock'
import { validateConfig, type Configuration, type CoreSchema } from './config'
import { type DeliveryFactory, TracePayloadEncoder } from './delivery'
import { type IdGenerator } from './id-generator'
import { type Persistence } from './persistence'
import { type Plugin } from './plugin'
import ProbabilityFetcher from './probability-fetcher'
import ProbabilityManager from './probability-manager'
import { BufferingProcessor, type Processor } from './processor'
import { InMemoryQueue } from './retry-queue'
import Sampler from './sampler'
import { coreSpanOptionSchema, validateSpanOptions, type Span, type SpanOptions } from './span'
import { DefaultSpanContextStorage, type SpanContext, type SpanContextStorage } from './span-context'
import { SpanFactory } from './span-factory'

export interface BugsnagPerformance<C extends Configuration> {
  start: (config: C | string) => void
  startSpan: (name: string, options?: SpanOptions) => Span
  readonly currentSpanContext: SpanContext | undefined
}

export interface ClientOptions<S extends CoreSchema, C extends Configuration> {
  clock: Clock
  idGenerator: IdGenerator
  deliveryFactory: DeliveryFactory
  backgroundingListener: BackgroundingListener
  resourceAttributesSource: ResourceAttributeSource<C>
  spanAttributesSource: SpanAttributesSource<C>
  schema: S
  plugins: (spanFactory: SpanFactory<C>, spanContextStorage: SpanContextStorage) => Array<Plugin<C>>
  persistence: Persistence
  spanContextStorage?: SpanContextStorage
}

export function createClient<S extends CoreSchema, C extends Configuration> (options: ClientOptions<S, C>): BugsnagPerformance<C> {
  const bufferingProcessor = new BufferingProcessor()
  let processor: Processor = bufferingProcessor
  const spanContextStorage = options.spanContextStorage || new DefaultSpanContextStorage(options.backgroundingListener)
  let logger = options.schema.logger.defaultValue
  const sampler = new Sampler(1.0)
  const spanFactory = new SpanFactory(
    processor,
    sampler,
    options.idGenerator,
    options.spanAttributesSource,
    options.clock,
    options.backgroundingListener,
    logger,
    spanContextStorage
  )
  const plugins = options.plugins(spanFactory, spanContextStorage)

  return {
    start: (config: C | string) => {
      const configuration = validateConfig<S, C>(config, options.schema)

      const delivery = options.deliveryFactory(configuration.endpoint)

      options.spanAttributesSource.configure(configuration)

      ProbabilityManager.create(
        options.persistence,
        sampler,
        new ProbabilityFetcher(delivery, configuration.apiKey)
      ).then((manager: ProbabilityManager) => {
        processor = new BatchProcessor(
          delivery,
          configuration,
          new InMemoryQueue(delivery, configuration.retryQueueMaxSize),
          sampler,
          manager,
          new TracePayloadEncoder(options.clock, configuration, options.resourceAttributesSource)
        )

        // ensure all spans started before .start() are added to the batch
        for (const span of bufferingProcessor.spans) {
          processor.add(span)
        }

        // register with the backgrounding listener - we do this in 'start' as
        // there's nothing to do if we're backgrounded before start is called
        // e.g. we can't trigger delivery until we have the apiKey and endpoint
        // from configuration
        options.backgroundingListener.onStateChange(state => {
          (processor as BatchProcessor<C>).flush()
        })

        logger = configuration.logger
        spanFactory.configure(processor, logger)
      })

      for (const plugin of plugins) {
        plugin.configure(configuration)
      }
    },
    startSpan: (name, spanOptions?: SpanOptions) => {
      const cleanOptions = validateSpanOptions(name, spanOptions, coreSpanOptionSchema, logger)
      const span = spanFactory.startSpan(cleanOptions.name, cleanOptions.options)
      span.setAttribute('bugsnag.span.category', 'custom')
      return spanFactory.toPublicApi(span)
    },
    get currentSpanContext () {
      return spanContextStorage.current
    }
  }
}

export function createNoopClient<C extends Configuration> (): BugsnagPerformance<C> {
  const noop = () => {}

  return {
    start: noop,
    startSpan: () => ({ id: '', traceId: '', end: noop, isValid: () => false }),
    currentSpanContext: undefined
  }
}
