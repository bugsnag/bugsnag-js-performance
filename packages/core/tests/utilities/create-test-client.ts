import { createClient } from '../../lib/core'
import type { ClientOptions, BugsnagPerformance } from '../../lib/core'
import { InMemoryProcessor, StableIdGenerator, IncrementingClock, resourceAttributes } from '.'

const defaultOptions = () => ({
  processor: new InMemoryProcessor(),
  idGenerator: new StableIdGenerator(),
  clock: new IncrementingClock(),
  resourceAttributes
})

function createTestClient (optionOverrides: Partial<ClientOptions> = {}): BugsnagPerformance {
  return createClient({ ...defaultOptions(), ...optionOverrides })
}

export default createTestClient
