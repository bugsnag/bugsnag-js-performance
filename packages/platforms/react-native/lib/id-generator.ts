import type { BitLength, IdGenerator } from '@bugsnag/core-performance'
import type { Spec as NativeBugsnag } from './NativeBugsnagPerformance'
import createEntropySource from './entropy-source'

function toHex (value: number): string {
  const hex = value.toString(16)

  // pad hex with a leading 0 if it's not already 2 characters
  if (hex.length === 1) {
    return '0' + hex
  }

  return hex
}

function createIdGenerator (NativeBugsnagPerformance: NativeBugsnag | null): IdGenerator {
  const { nextByte } = createEntropySource(NativeBugsnagPerformance)

  const idGenerator: IdGenerator = {
    generate (bits: BitLength): string {
      const bytes = bits / 8

      let randomValue = ''

      for (let i = 0; i < bytes; i++) {
        randomValue += toHex(nextByte())
      }

      return randomValue
    }
  }

  return idGenerator
}

export default createIdGenerator
