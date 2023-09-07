import type { BitLength, IdGenerator } from '@bugsnag/core-performance'

function toHex (value: number): string {
  const hex = value.toString(16)

  // pad hex with a leading 0 if it's not already 2 characters
  if (hex.length === 1) {
    return '0' + hex
  }

  return hex
}

const idGenerator: IdGenerator = {
  generate (bits: BitLength): string {
    const bytes = bits / 8

    let randomValue = ''

    for (let i = 0; i < bytes; i++) {
      randomValue += toHex((Math.random() * 255) | 0)
    }

    return randomValue
  }
}

export default idGenerator
