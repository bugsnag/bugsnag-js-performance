import { type SpanEnded } from '@bugsnag/js-performance-core'

const BATCH_TIMEOUT_MS = 30000
const BATCH_LIMIT = 100

export class Queue {
  private batch: SpanEnded[]
  private onFlush: (spans: SpanEnded[]) => void
  private timeout: ReturnType<typeof setTimeout> | null

  constructor (onFlushCallback: (spans: SpanEnded[]) => void) {
    this.batch = []
    this.timeout = null
    this.onFlush = onFlushCallback
  }

  stopTimer = () => {
    if (this.timeout !== null) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  start = () => {
    if (this.timeout === null) {
      this.timeout = setTimeout(this.flush, BATCH_TIMEOUT_MS)
    }
  }

  flush = () => {
    this.stopTimer()
    this.onFlush(this.batch)
    this.batch.length = 0
  }

  add = (span: SpanEnded) => {
    this.batch.push(span)
    this.start()

    if (this.batch.length >= BATCH_LIMIT) {
      this.flush()
    }
  }
}
