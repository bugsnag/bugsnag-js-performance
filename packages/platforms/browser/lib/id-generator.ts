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
    const bytes = new Uint8Array(bits / 8)

    // TODO: do we just read window here?
    //       how can we pass this in given it needs to be valid before 'start' is called?
    const randomValues = window.crypto.getRandomValues(bytes)

    return Array.from(randomValues).map(toHex).join('')
  }
}

export default idGenerator
