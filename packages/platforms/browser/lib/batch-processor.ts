import type { Processor, SpanEnded } from '@bugsnag/js-performance-core'

const BATCH_TIMEOUT_MS = 30000
const BATCH_LIMIT = 100

export class BatchProcessor implements Processor {
  private batch: SpanEnded[] = []
  private timeout: ReturnType<typeof setTimeout> | null = null

  constructor (private onFlushCallback = (batch: SpanEnded[]) => {}) {}

  private stop = () => {
    if (this.timeout !== null) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  private start = () => {
    if (this.timeout === null) {
      this.timeout = setTimeout(this.flush, BATCH_TIMEOUT_MS)
    }
  }

  private flush = () => {
    this.stop()
    this.onFlushCallback(this.batch)
    this.batch = []
  }

  add = (span: SpanEnded) => {
    this.batch.push(span)
    this.start()

    if (this.batch.length >= BATCH_LIMIT) {
      this.flush()
    }
  }
}
