import type { IdGenerator, BitLength } from '@bugsnag/core-performance'

class IncrementingIdGenerator implements IdGenerator {
  spanCount: number = 0
  traceCount: number = 0
  generate (bits: BitLength): string {
    if (bits === 64) {
      return `span ID ${++this.spanCount}`
    }
    return `trace ID ${++this.traceCount}`
  }
}

export default IncrementingIdGenerator
