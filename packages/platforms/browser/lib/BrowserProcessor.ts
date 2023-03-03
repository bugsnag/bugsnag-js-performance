import {
  type Clock,
  type Configuration,
  type Delivery,
  type DeliveryPayload,
  type Processor,
  type ProcessorFactory,
  type ResourceAttributeSource,
  type SpanEnded,
  attributeToJson,
  spanToJson
} from '@bugsnag/js-performance-core'
import clock from './clock'
import browserDelivery, { type Fetch } from './delivery'
import createResourceAttributesSource from './resource-attributes-source'

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
    const resourceAttributes = this.resourceAttributeSource()
    const spans = [span]

    const payload: DeliveryPayload = {
      resourceSpans: [
        {
          resource: {
            attributes: Object.entries(resourceAttributes).map(([key, value]) => attributeToJson(key, value))
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
  private navigator: Navigator

  constructor (fetch: Fetch, navigator: Navigator) {
    this.fetch = fetch
    this.navigator = navigator
  }

  create (
    configuration: Required<Configuration>
  ): BrowserProcessor {
    return new BrowserProcessor(
      configuration.apiKey,
      configuration.endpoint,
      browserDelivery(this.fetch),
      clock,
      createResourceAttributesSource(this.navigator)
    )
  }
}
