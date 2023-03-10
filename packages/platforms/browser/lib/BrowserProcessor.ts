import {
  type Clock,
  type Configuration,
  type Delivery,
  type DeliveryPayload,
  type Processor,
  type ProcessorFactory,
  type ResourceAttributeSource,
  type SpanEnded,
  spanToJson
} from '@bugsnag/js-performance-core'
import browserDelivery, { type Fetch } from './delivery'

export class BrowserProcessor implements Processor {
  private apiKey: string
  private endpoint: string
  private delivery: Delivery
  private clock: Clock
  private resourceAttributeSource: ResourceAttributeSource

  constructor (
    apiKey: string,
    endpoint: string,
    delivery: Delivery,
    clock: Clock,
    resourceAttributeSource: ResourceAttributeSource
  ) {
    this.apiKey = apiKey
    this.endpoint = endpoint
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
            attributes: this.resourceAttributeSource().toJson()
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
      this.endpoint,
      this.apiKey,
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
      configuration.apiKey,
      configuration.endpoint,
      browserDelivery(this.fetch),
      this.clock,
      this.resourceAttributeSource
    )
  }
}
