import { type ResourceAttributeSource } from './attributes'
import { type Clock } from './clock'
import { type InternalConfiguration } from './config'
import { type Delivery } from './delivery'
import { type Processor } from './processor'
import { type RetryQueue } from './retry-queue'
import { spanToJson, type SpanEnded } from './span'

export class BatchProcessor implements Processor {
  private batch: SpanEnded[] = []
  private timeout: ReturnType<typeof setTimeout> | null = null

  constructor (
    private delivery: Delivery,
    private configuration: InternalConfiguration,
    private resourceAttributeSource: ResourceAttributeSource,
    private clock: Clock,
    private retryQueue: RetryQueue
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

  add (span: SpanEnded) {
    if (this.configuration.enabledReleaseStages &&
      !this.configuration.enabledReleaseStages.includes(this.configuration.releaseStage)
    ) {
      return
    }

    this.batch.push(span)

    if (this.batch.length >= this.configuration.maximumBatchSize) {
      this.flush()
    } else {
      this.start()
    }
  }

  async flush () {
    this.stop()

    if (this.batch.length === 0) {
      return
    }

    const batch = this.batch
    this.batch = []

    const payload = {
      resourceSpans: [
        {
          resource: {
            attributes: this.resourceAttributeSource(this.configuration).toJson()
          },
          scopeSpans: [
            {
              spans: batch.map((span) => spanToJson(span, this.clock))
            }
          ]
        }
      ]
    }

    try {
      const { state } = await this.delivery.send(
        this.configuration.endpoint,
        this.configuration.apiKey,
        payload
      )

      switch (state) {
        case 'success':
          this.retryQueue.flush()
          break
        case 'failure-discard':
          this.configuration.logger.warn('delivery failed')
          break
        case 'failure-retryable':
          this.configuration.logger.info('delivery failed, adding to retry queue')
          this.retryQueue.add(payload)
          break
        default: {
          const _exhaustiveCheck: never = state
          return _exhaustiveCheck
        }
      }
    } catch (err) {
      this.configuration.logger.warn('delivery failed')
    }
  }
}
