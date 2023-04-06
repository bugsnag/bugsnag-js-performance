import { SpanAttributes, type ResourceAttributeSource, type SpanAttributesSource } from './attributes'
import { type BackgroundingListener } from './backgrounding-listener'
import { BatchProcessor } from './batch-processor'
import { type Clock } from './clock'
import { validateConfig, type Configuration, type CoreSchema } from './config'
import { type Delivery } from './delivery'
import { type IdGenerator } from './id-generator'
import { BufferingProcessor, type Processor } from './processor'
import { InMemoryQueue } from './retry-queue'
import { Kind, type Span, type SpanInternal, type Time } from './span'

export interface BugsnagPerformance {
  start: (config: Configuration | string) => void
  /**
   * Start a new custom span
   * @param name the name of the span
   * @param startTime an optional start time - either a Date or a value captured from performance.now()
   * @returns {Span} Returns a new Span
   */
  startSpan: (name: string, startTime?: Time) => Span
}

function sanitizeTime (clock: Clock, time?: Time): number {
  if (typeof time === 'number') {
    // no need to change anything - we want to store numbers anyway
    // we assume this is the correct precision for the platform
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
  delivery: Delivery
  backgroundingListener: BackgroundingListener
  resourceAttributesSource: ResourceAttributeSource
  spanAttributesSource: SpanAttributesSource
  schema: CoreSchema
}

export function createClient (options: ClientOptions): BugsnagPerformance {
  const bufferingProcessor = new BufferingProcessor()
  let processor: Processor = bufferingProcessor

  return {
    start: (config: Configuration | string) => {
      const configuration = validateConfig(config, options.schema)
      const retryQueue = new InMemoryQueue(options.delivery, configuration.endpoint, configuration.apiKey, configuration.retryQueueMaxSize)
      processor = new BatchProcessor(options.delivery, configuration, options.resourceAttributesSource, options.clock, retryQueue)

      // ensure all spans started before .start() are added to the batch
      bufferingProcessor.spans.forEach(span => {
        processor.add(span)
      })

      // register with the backgrounding listener - we do this in 'start' as
      // there's nothing to do if we're backgrounded before start is called
      // e.g. we can't trigger delivery until we have the apiKey and endpoint
      // from configuration
      options.backgroundingListener.onStateChange(state => {
        // to be implemented
      })
    },
    startSpan: (name, startTime) => {
      const spanInternal: SpanInternal = {
        name,
        kind: Kind.Client, // TODO: How do we define the current kind?
        id: options.idGenerator.generate(64),
        traceId: options.idGenerator.generate(128),
        startTime: sanitizeTime(options.clock, startTime),
        attributes: new SpanAttributes(options.spanAttributesSource())
      }

      return {
        // TODO Expose internal span to platforms using Symbol / WeakMap?
        end: (endTime) => {
          processor.add({ ...spanInternal, endTime: sanitizeTime(options.clock, endTime) })
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
