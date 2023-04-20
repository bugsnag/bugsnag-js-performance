import { SpanAttributes, type ResourceAttributeSource, type SpanAttributesSource } from './attributes'
import { type BackgroundingListener } from './backgrounding-listener'
import { BatchProcessor } from './batch-processor'
import { type Clock } from './clock'
import { validateConfig, type Configuration, type CoreSchema } from './config'
import { type DeliveryFactory } from './delivery'
import { type IdGenerator } from './id-generator'
import { BufferingProcessor, type Processor } from './processor'
import { InMemoryQueue } from './retry-queue'
import Sampler from './sampler'
import { Kind, type Span, type SpanEnded, type Time } from './span'
import traceIdToSamplingRate from './trace-id-to-sampling-rate'

export interface BugsnagPerformance {
  start: (config: Configuration | string) => void
  startSpan: (name: string, startTime?: Time) => Span
}

function sanitizeTime (clock: Clock, time?: Time): number {
  if (typeof time === 'number') {
    // no need to change anything - we want to store numbers anyway
    // we assume this is nanosecond precision
    return time
  }

  if (time instanceof Date) {
    return clock.convert(time)
  }

  return clock.now()
}

export interface ClientOptions {
  clock: Clock
  idGenerator: IdGenerator
  deliveryFactory: DeliveryFactory
  backgroundingListener: BackgroundingListener
  resourceAttributesSource: ResourceAttributeSource
  spanAttributesSource: SpanAttributesSource
  schema: CoreSchema
}

export function createClient (options: ClientOptions): BugsnagPerformance {
  const bufferingProcessor = new BufferingProcessor()
  let processor: Processor = bufferingProcessor

  const sampler = new Sampler(1.0)

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
    },
    startSpan: (name, startTime) => {
      const safeStartTime = sanitizeTime(options.clock, startTime)
      const attributes = new SpanAttributes(options.spanAttributesSource())

      return {
        end: (endTime) => {
          const safeEndTime = sanitizeTime(options.clock, endTime)
          const traceId = options.idGenerator.generate(128)

          const span: SpanEnded = {
            name,
            kind: Kind.Client, // TODO: How do we define the current kind?
            id: options.idGenerator.generate(64),
            traceId,
            startTime: safeStartTime,
            endTime: safeEndTime,
            attributes,
            samplingRate: traceIdToSamplingRate(traceId),
            samplingProbability: sampler.spanProbability
          }

          if (sampler.sample(span)) {
            processor.add(span)
          }
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
