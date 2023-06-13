import { type IdGenerator, type BitLength } from '@bugsnag/core-performance'

class StableIdGenerator implements IdGenerator {
  generate (bits: BitLength): string {
    return `a random ${bits} bit string`
  }
}

export default StableIdGenerator
