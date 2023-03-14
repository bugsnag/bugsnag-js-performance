import {
  spanToJson,
  type Clock,
  type Configuration,
  type Delivery,
  type DeliveryPayload,
  type Processor,
  type ProcessorFactory,
  type ResourceAttributeSource,
  type SpanEnded,
  type InternalConfiguration
} from '@bugsnag/js-performance-core'
import browserDelivery, { type Fetch } from './delivery'

export class BrowserProcessor implements Processor {
  private configuration: InternalConfiguration
  private delivery: Delivery
  private clock: Clock
  private resourceAttributeSource: ResourceAttributeSource

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
  }

  add (span: SpanEnded): void {
    const spans = [span]

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
    configuration: Required<Configuration>
  ): BrowserProcessor {
    return new BrowserProcessor(
      configuration,
      browserDelivery(this.fetch),
      this.clock,
      this.resourceAttributeSource
    )
  }
}
