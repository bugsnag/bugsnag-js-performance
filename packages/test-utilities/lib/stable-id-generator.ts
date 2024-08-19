import type { IdGenerator, BitLength } from '@bugsnag/core-performance'

class StableIdGenerator implements IdGenerator {
  generate (bits: BitLength): string {
    return `a random ${bits} bit string`
  }
}

export default StableIdGenerator
