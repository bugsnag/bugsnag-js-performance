import { type ResourceAttributeSource } from './attributes'
import { type Clock } from './clock'
import { type InternalConfiguration } from './config'
import { type Delivery } from './delivery'
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
  ) {
    this.flush = this.flush.bind(this)
  }

  private stop () {
    if (this.timeout !== null) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  private start () {
    this.stop()
    this.timeout = setTimeout(this.flush, this.configuration.batchInactivityTimeoutMs)
  }

  private flush () {
    this.stop()

    if (!this.configuration.enabledReleaseStages || this.configuration.enabledReleaseStages.includes(this.configuration.releaseStage)) {
      this.delivery.send(
        this.configuration.endpoint,
        this.configuration.apiKey,
        {
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
      )
    }

    this.batch = []
  }

  add (span: SpanEnded) {
    this.batch.push(span)
    this.start()

    if (this.batch.length >= this.configuration.maximumBatchSize) {
      this.flush()
    }
  }
}
