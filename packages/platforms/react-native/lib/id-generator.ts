import type { BitLength, IdGenerator } from '@bugsnag/core-performance'
import NativeBugsnagPerformance from './native'

const POOL_SIZE = 1024

const CALLS_BEFORE_POOL_REFRESH = 1000

export function toHex (value: number): string {
  const hex = value.toString(16)

  // pad hex with a leading 0 if it's not already 2 characters
  if (hex.length === 1) {
    return '0' + hex
  }

  return hex
}

export function createRandomString (): string {
  let random = ''

  for (let i = 0; i < POOL_SIZE; i++) {
    random += toHex((Math.random() * 255) | 0)
  }

  return random
}

function createIdGenerator (isDebuggingRemotely = false): IdGenerator {
  // If the native module is not available or remote debugging is enabled, fall back to a JS implementation
  const requestEntropy = !isDebuggingRemotely
    ? NativeBugsnagPerformance.requestEntropy
    : createRandomString

  // initialise the pool synchronously
  const randomValues = requestEntropy()
  let randomPool = randomValues.length > 0 ? randomValues : createRandomString()

  const regeneratePool = async () => {
    const randomValues = await NativeBugsnagPerformance.requestEntropyAsync()
    randomPool = randomValues.length > 0 ? randomValues : createRandomString()
  }

  let numberOfCalls = 0
  const idGenerator: IdGenerator = {
    generate (bits: BitLength): string {
      const chars = bits / 4
      let id = ''

      // pick characters from the pool semi-randomly
      for (let i = 0; i < chars; i++) {
        const randomIndex = (Math.random() * (randomPool.length - 1)) | 0
        id += randomPool[randomIndex]
      }

      // if the max number of calls has been reached, refresh the pool asynchronously
      if (++numberOfCalls >= CALLS_BEFORE_POOL_REFRESH) {
        numberOfCalls = 0
        regeneratePool()
      }

      return id
    }
  }

  return idGenerator
}

export default createIdGenerator
