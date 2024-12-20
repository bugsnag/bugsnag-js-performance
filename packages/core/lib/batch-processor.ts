import type { Configuration, InternalConfiguration } from './config'
import type { Delivery, TracePayloadEncoder } from './delivery'
import type ProbabilityManager from './probability-manager'
import type { Processor } from './processor'
import type { RetryQueue } from './retry-queue'
import type { ReadonlySampler } from './sampler'
import type { SpanEnded } from './span'

import { runSpanEndCallbacks } from './span'

type MinimalProbabilityManager = Pick<ProbabilityManager, 'setProbability' | 'ensureFreshProbability'>

export class BatchProcessor<C extends Configuration> implements Processor {
  private readonly delivery: Delivery
  private readonly configuration: InternalConfiguration<C>
  private readonly retryQueue: RetryQueue
  private readonly sampler: ReadonlySampler
  private readonly probabilityManager: MinimalProbabilityManager
  private readonly encoder: TracePayloadEncoder<C>

  private spans: SpanEnded[] = []
  private timeout: ReturnType<typeof setTimeout> | null = null
  private flushQueue: Promise<void> = Promise.resolve()

  constructor (
    delivery: Delivery,
    configuration: InternalConfiguration<C>,
    retryQueue: RetryQueue,
    sampler: ReadonlySampler,
    probabilityManager: MinimalProbabilityManager,
    encoder: TracePayloadEncoder<C>
  ) {
    this.delivery = delivery
    this.configuration = configuration
    this.retryQueue = retryQueue
    this.sampler = sampler
    this.probabilityManager = probabilityManager
    this.encoder = encoder
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

    this.spans.push(span)

    if (this.spans.length >= this.configuration.maximumBatchSize) {
      this.flush()
    } else {
      this.start()
    }
  }

  async flush () {
    this.stop()

    this.flushQueue = this.flushQueue.then(async () => {
      const batch = await this.prepareBatch()

      // we either had nothing in the batch originally or all spans were discarded
      if (!batch) {
        return
      }

      const payload = await this.encoder.encode(batch)
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
          default:
          response.state satisfies never
        }
      } catch (err) {
        this.configuration.logger.warn('delivery failed')
      }
    })

    await this.flushQueue
  }

  private async prepareBatch (): Promise<SpanEnded[] | undefined> {
    if (this.spans.length === 0) {
      return
    }

    // ensure we have a fresh probability value before building the batch
    await this.probabilityManager.ensureFreshProbability()

    // update sampling values if necessary and re-sample
    const batch: SpanEnded[] = []
    const probability = this.sampler.spanProbability

    for (const span of this.spans) {
      if (span.samplingProbability.raw > probability.raw) {
        span.samplingProbability = probability
      }

      if (this.sampler.sample(span)) {
        // Run any callbacks that have been registered before batching
        // as callbacks could cause the span to be discarded
        const shouldAddToBatch = await runSpanEndCallbacks(span, this.configuration.logger, this.configuration.onSpanEnd)
        if (shouldAddToBatch) batch.push(span)
      }
    }

    // clear out the current batch so we're ready to start a new one
    this.spans = []

    // if every span was discarded there's nothing to send
    if (batch.length === 0) {
      return
    }

    return batch
  }
}
