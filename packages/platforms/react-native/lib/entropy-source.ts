import { type Spec as NativeBugsnagPerformance } from './NativeBugsnagPerformance'

export interface EntropySource {
  nextByte: () => number
}

const POOL_SIZE = 1024

// fill the pool with random values
export function fill (pool: Uint8Array) {
  for (let i = 0; i < pool.length; i++) {
    pool[i] = (Math.random() * 255) | 0
  }
}

// shuffle the existing values in the pool
export function shuffle (pool: Uint8Array) {
  for (let i = 0; i < POOL_SIZE; i++) {
    const otherIndex = (Math.random() * (POOL_SIZE - 1)) | 0
    const otherValue = pool[otherIndex]
    pool[otherIndex] = pool[i]
    pool[i] = otherValue
  }
}

const createEntropySource = (NativeBugsnag: NativeBugsnagPerformance | null): EntropySource => {
  const pool = new Uint8Array(POOL_SIZE)

  // initialise the pool synchronously
  const randomValues = NativeBugsnag && NativeBugsnag.requestEntropy()
  randomValues && randomValues.length > 0 ? pool.set(randomValues) : fill(pool)

  // if the native module is not available, we will regenerate the pool synchronously in JS,
  // otherwise we will regenerate asynchronously from the native module
  let regenerate = () => { fill(pool) }
  if (NativeBugsnag) {
    regenerate = async () => {
      const randomValues = await NativeBugsnag.requestEntropyAsync()
      randomValues.length > 0 ? pool.set(randomValues) : fill(pool)
    }
  }

  let nextIndex = 0
  const nextByte = () => {
    const value = pool[nextIndex]
    nextIndex++

    // when the pool is exhausted, trigger an async operation to regenerate.
    // We also shuffle the current pool so that we don't have to wait for
    // regenerate to complete before we can continue to use the pool.
    if (nextIndex >= POOL_SIZE) {
      nextIndex = 0
      shuffle(pool)
      regenerate()
    }

    return value
  }

  return { nextByte }
}

export default createEntropySource
