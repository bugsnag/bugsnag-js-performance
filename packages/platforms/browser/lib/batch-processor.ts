import type { Processor, SpanEnded } from '@bugsnag/js-performance-core'

export class BatchProcessor implements Processor {
  private batch: SpanEnded[] = []
  private timeout: ReturnType<typeof setTimeout> | null = null

  constructor (
    private onFlushCallback = (batch: SpanEnded[]) => {},
    private batchTimeoutMs = 30000,
    private batchLimit = 100
  ) {}

  private stop = () => {
    if (this.timeout !== null) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  private start = () => {
    if (this.timeout === null) {
      this.timeout = setTimeout(this.flush, this.batchTimeoutMs)
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

    if (this.batch.length >= this.batchLimit) {
      this.flush()
    }
  }
}
