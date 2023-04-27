import { type ResourceAttributeSource, type SpanAttributesSource } from './attributes'
import { type BackgroundingListener } from './backgrounding-listener'
import { BatchProcessor } from './batch-processor'
import { type Clock } from './clock'
import { validateConfig, type Configuration, type CoreSchema } from './config'
import { type DeliveryFactory } from './delivery'
import { type IdGenerator } from './id-generator'
import { type Plugin } from './plugin'
import { BufferingProcessor, type Processor } from './processor'
import { InMemoryQueue } from './retry-queue'
import Sampler from './sampler'
import { SpanFactory, type Span } from './span'
import { timeToNumber, type Time } from './time'

export interface BugsnagPerformance {
  start: (config: Configuration | string) => void
  startSpan: (name: string, startTime?: Time) => Span
}

export interface ClientOptions <S extends CoreSchema> {
  clock: Clock
  idGenerator: IdGenerator
  deliveryFactory: DeliveryFactory
  backgroundingListener: BackgroundingListener
  resourceAttributesSource: ResourceAttributeSource
  spanAttributesSource: SpanAttributesSource
  schema: S
  plugins: (spanFactory: SpanFactory) => Plugin[]
}

export function createClient <S extends CoreSchema> (options: ClientOptions<S>): BugsnagPerformance {
  const bufferingProcessor = new BufferingProcessor()
  let processor: Processor = bufferingProcessor

  const sampler = new Sampler(1.0)
  const spanFactory = new SpanFactory(processor, sampler, options.idGenerator, options.spanAttributesSource)
  const plugins = options.plugins(spanFactory)

  return {
    start: (config: Configuration | string) => {
      const configuration = validateConfig(config, options.schema)

      sampler.probability = configuration.samplingProbability

      const delivery = options.deliveryFactory(configuration.apiKey, configuration.endpoint)

      processor = new BatchProcessor(
        delivery,
        configuration,
        options.resourceAttributesSource,
        options.clock,
        new InMemoryQueue(delivery, configuration.retryQueueMaxSize),
        sampler
      )

      // ensure all spans started before .start() are added to the batch
      bufferingProcessor.spans.forEach(span => {
        processor.add(span)
      })

      // register with the backgrounding listener - we do this in 'start' as
      // there's nothing to do if we're backgrounded before start is called
      // e.g. we can't trigger delivery until we have the apiKey and endpoint
      // from configuration
      options.backgroundingListener.onStateChange(state => {
        (processor as BatchProcessor).flush()
      })

      spanFactory.updateProcessor(processor)

      for (const plugin of plugins) {
        plugin.configure(configuration)
      }
    },
    startSpan: (name, startTime) => {
      const safeStartTime = timeToNumber(options.clock, startTime)
      const span = spanFactory.startSpan(name, safeStartTime)

      return {
        end: (endTime) => {
          const safeEndTime = timeToNumber(options.clock, endTime)
          spanFactory.endSpan(span, safeEndTime)
        }
      }
    }
  }
}

export function createNoopClient (): BugsnagPerformance {
  const noop = () => {}

  return {
    start: noop,
    startSpan: () => ({ end: noop })
  }
}
