import type { IdGenerator, BitLength } from '../../lib/id-generator'

class StableIdGenerator implements IdGenerator {
  generate (bits: BitLength): string {
    return `a random ${bits} bit string`
  }
}

export default StableIdGenerator
