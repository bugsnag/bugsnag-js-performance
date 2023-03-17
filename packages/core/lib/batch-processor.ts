import { type ResourceAttributeSource } from './attributes'
import { type Clock } from './clock'
import { type InternalConfiguration } from './config'
import { type Delivery, type DeliveryPayload } from './delivery'
import { type Processor } from './processor'
import { spanToJson, type SpanEnded } from './span'

export class BatchProcessor implements Processor {
  private batch: SpanEnded[] = []
  private timeout: ReturnType<typeof setTimeout> | null = null

  constructor (
    private delivery: Delivery,
    private configuration: InternalConfiguration,
    private resourceAttributeSource: ResourceAttributeSource,
    private clock: Clock
  ) {}

  private stop = () => {
    if (this.timeout !== null) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  private start = () => {
    if (this.timeout === null) {
      this.timeout = setTimeout(this.flush, this.configuration.batchInactivityTimeoutMs)
    }
  }

  private flush = () => {
    this.stop()
    const payload: DeliveryPayload = {
      resourceSpans: [
        {
          resource: {
            attributes: this.resourceAttributeSource(this.configuration).toJson()
          },
          scopeSpans: [
            {
              spans: this.batch.map((span) => spanToJson(span, this.clock))
            }
          ]
        }
      ]
    }

    this.batch = []
    this.delivery.send(
      this.configuration.endpoint,
      this.configuration.apiKey,
      payload
    )
  }

  add = (span: SpanEnded) => {
    this.batch.push(span)
    this.start()

    if (this.batch.length >= this.configuration.maximumBatchSize) {
      this.flush()
    }
  }
}
