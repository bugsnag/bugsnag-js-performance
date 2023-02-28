import type { BitLength, IdGenerator } from '@bugsnag/js-performance-core/lib/id-generator.js'

function toHex (value: number): string {
  return value.toString(16).padStart(2, '0')
}

const idGenerator: IdGenerator = {
  generate (bits: BitLength): string {
    const bytes = new Uint8Array(bits / 8)

    // TODO: do we just read window here?
    //       how can we pass this in given it needs to be valid before 'start' is called?
    const randomValues = window.crypto.getRandomValues(bytes)

    return Array.from(randomValues, toHex).join('')
  }
}

export default idGenerator
