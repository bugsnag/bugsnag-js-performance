import { type ResourceAttributeSource } from './attributes'
import { type Clock } from './clock'
import { type Configuration, type InternalConfiguration } from './config'
import { type Delivery, type DeliverySpan } from './delivery'
import { type Processor } from './processor'
import type ProbabilityManager from './probability-manager'
import { type RetryQueue } from './retry-queue'
import { type ReadonlySampler } from './sampler'
import { spanToJson, type SpanEnded } from './span'

type MinimalProbabilityManager = Pick<ProbabilityManager, 'setProbability'>

export class BatchProcessor<C extends Configuration> implements Processor {
  private readonly delivery: Delivery
  private readonly configuration: InternalConfiguration<C>
  private readonly resourceAttributeSource: ResourceAttributeSource<C>
  private readonly clock: Clock
  private readonly retryQueue: RetryQueue
  private readonly sampler: ReadonlySampler
  private readonly probabilityManager: MinimalProbabilityManager

  private batch: SpanEnded[] = []
  private timeout: ReturnType<typeof setTimeout> | null = null

  constructor (
    delivery: Delivery,
    configuration: InternalConfiguration<C>,
    resourceAttributeSource: ResourceAttributeSource<C>,
    clock: Clock,
    retryQueue: RetryQueue,
    sampler: ReadonlySampler,
    probabilityManager: MinimalProbabilityManager
  ) {
    this.delivery = delivery
    this.configuration = configuration
    this.resourceAttributeSource = resourceAttributeSource
    this.clock = clock
    this.retryQueue = retryQueue
    this.sampler = sampler
    this.probabilityManager = probabilityManager
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
        this.probabilityManager.setProbability(response.samplingProbability)
      }

      switch (response.state) {
        case 'success':
          this.retryQueue.flush()
          break
        case 'failure-discard':
          this.configuration.logger.warn('delivery failed')
          break
        case 'failure-retryable':
          this.configuration.logger.info('delivery failed, adding to retry queue')
          this.retryQueue.add(payload, batchTime)
          break
        default: {
          const _exhaustiveCheck: never = response.state
          return _exhaustiveCheck
        }
      }
    } catch (err) {
      this.configuration.logger.warn('delivery failed')
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
