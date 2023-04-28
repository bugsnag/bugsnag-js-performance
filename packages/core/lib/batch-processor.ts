import { type ResourceAttributeSource } from './attributes'
import { type Clock } from './clock'
import { type Configuration, type InternalConfiguration } from './config'
import { type Delivery, type DeliverySpan } from './delivery'
import { type Processor } from './processor'
import { type RetryQueue } from './retry-queue'
import type Sampler from './sampler'
import { spanToJson, type SpanEnded } from './span'

export class BatchProcessor<C extends Configuration> implements Processor {
  private batch: SpanEnded[] = []
  private timeout: ReturnType<typeof setTimeout> | null = null

  constructor (
    private delivery: Delivery,
    private configuration: InternalConfiguration<C>,
    private resourceAttributeSource: ResourceAttributeSource<C>,
    private clock: Clock,
    private retryQueue: RetryQueue,
    private sampler: Sampler
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
      this.configuration.releaseStage &&
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

    const batch = this.prepareBatch()

    // we either had nothing in the batch originally or all spans were discarded
    if (!batch) {
      return
    }

    const payload = {
      resourceSpans: [
        {
          resource: {
            attributes: this.resourceAttributeSource(this.configuration).toJson()
          },
          scopeSpans: [{ spans: batch }]
        }
      ]
    }

    const batchTime = Date.now()

    try {
      const response = await this.delivery.send(payload)

      if (response.samplingProbability !== undefined) {
        this.sampler.probability = response.samplingProbability
      }

      switch (response.state) {
        case 'success':
          this.retryQueue.flush()
          break
        case 'failure-discard':
          this.configuration.logger?.warn('delivery failed')
          break
        case 'failure-retryable':
          this.configuration.logger?.info('delivery failed, adding to retry queue')
          this.retryQueue.add(payload, batchTime)
          break
        default: {
          const _exhaustiveCheck: never = response.state
          return _exhaustiveCheck
        }
      }
    } catch (err) {
      this.configuration.logger?.warn('delivery failed')
    }
  }

  private prepareBatch (): DeliverySpan[] | undefined {
    if (this.batch.length === 0) {
      return
    }

    // update sampling values if necessary and re-sample
    const batch: DeliverySpan[] = []
    const probability = this.sampler.spanProbability

    for (const span of this.batch) {
      if (span.samplingProbability < probability) {
        span.samplingProbability = probability
      }

      if (this.sampler.sample(span)) {
        batch.push(spanToJson(span, this.clock))
      }
    }

    // clear out the current batch so we're ready to start a new one
    this.batch = []

    // if every span was discarded there's nothing to send
    if (batch.length === 0) {
      return
    }

    return batch
  }
}
