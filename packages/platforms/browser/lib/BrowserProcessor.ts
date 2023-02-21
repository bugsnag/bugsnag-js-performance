import { type Configuration } from '@bugsnag/js-performance-core'
import { attributeToJson, type ResourceAttributeSource } from '@bugsnag/js-performance-core/lib/attributes'
import { type Clock } from '@bugsnag/js-performance-core/lib/clock'
import { type Delivery, type DeliveryPayload } from '@bugsnag/js-performance-core/lib/delivery'
import { type Processor, type ProcessorFactory } from '@bugsnag/js-performance-core/lib/processor'
import { spanToJson, type SpanEnded } from '@bugsnag/js-performance-core/lib/span'
import clock from './clock'
import browserDelivery from './delivery'
import createResourceAttributesSource from './resource-attributes-source'

export class BrowserProcessor implements Processor {
  private apiKey: string
  private endpoint: string
  private delivery: Delivery
  private clock: Clock
  private resourceAttributeSource: ResourceAttributeSource

  public spans: SpanEnded[] = []

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
  create (
    configuration: Configuration
  ): BrowserProcessor {
    return new BrowserProcessor(
      configuration.apiKey,
      configuration.endpoint || 'https://otlp.bugsnag.com/v1/traces',
      browserDelivery(global.fetch),
      clock,
      createResourceAttributesSource(navigator)
    )
  }
}
