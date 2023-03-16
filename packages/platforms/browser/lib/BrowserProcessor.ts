import {
  spanToJson,
  type Clock,
  type Delivery,
  type DeliveryPayload,
  type InternalConfiguration,
  type Processor,
  type ProcessorFactory,
  type ResourceAttributeSource,
  type SpanEnded
} from '@bugsnag/js-performance-core'
import { BatchProcessor } from './batch-processor'
import browserDelivery, { type Fetch } from './delivery'

// eslint-disable-next-line @typescript-eslint/naming-convention
const __ENABLE_BUGSNAG_TEST_CONFIGURATION__ = '__ENABLE_BUGSNAG_TEST_CONFIGURATION__'

export class BrowserProcessor implements Processor {
  private configuration: InternalConfiguration
  private delivery: Delivery
  private clock: Clock
  private resourceAttributeSource: ResourceAttributeSource
  private batchProcessor: BatchProcessor

  constructor (
    configuration: InternalConfiguration,
    delivery: Delivery,
    clock: Clock,
    resourceAttributeSource: ResourceAttributeSource
  ) {
    this.configuration = configuration
    this.delivery = delivery
    this.clock = clock
    this.resourceAttributeSource = resourceAttributeSource

    let maximumBatchSize = 100
    let batchInactivityTimeoutMilliseconds = 30 * 1000

    if (typeof __ENABLE_BUGSNAG_TEST_CONFIGURATION__ !== 'undefined' && __ENABLE_BUGSNAG_TEST_CONFIGURATION__) {
      // @ts-expect-error maximumBatchSize does not exist on type Required<Configuration>
      maximumBatchSize = configuration.maximumBatchSize
      // @ts-expect-error batchInactivityTimeoutMilliseconds does not exist on type Required<Configuration>
      batchInactivityTimeoutMilliseconds = configuration.batchInactivityTimeoutMilliseconds
    }

    this.batchProcessor = new BatchProcessor((spans) => {
      const payload: DeliveryPayload = {
        resourceSpans: [
          {
            resource: {
              attributes: this.resourceAttributeSource(this.configuration).toJson()
            },
            scopeSpans: [
              {
                spans: spans.map((span) => spanToJson(span, this.clock))
              }
            ]
          }
        ]
      }

      this.delivery.send(
        this.configuration.endpoint,
        this.configuration.apiKey,
        payload
      )
    }, batchInactivityTimeoutMilliseconds, maximumBatchSize)
  }

  add (span: SpanEnded): void {
    // Should we prevent delivery?
    if (this.configuration.enabledReleaseStages?.indexOf(this.configuration.releaseStage) === -1) return
    this.batchProcessor.add(span)
  }
}

export class BrowserProcessorFactory implements ProcessorFactory {
  private fetch: Fetch
  private resourceAttributeSource: ResourceAttributeSource
  private clock: Clock

  constructor (fetch: Fetch, resourceAttributeSource: ResourceAttributeSource, clock: Clock) {
    this.fetch = fetch
    this.resourceAttributeSource = resourceAttributeSource
    this.clock = clock
  }

  create (
    configuration: InternalConfiguration
  ): BrowserProcessor {
    return new BrowserProcessor(
      configuration,
      browserDelivery(this.fetch),
      this.clock,
      this.resourceAttributeSource
    )
  }
}
