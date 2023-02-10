import { createClient } from '../../lib/core'
import type { ClientOptions, BugsnagPerformance } from '../../lib/core'
import { InMemoryProcessor, StableIdGenerator, IncrementingClock } from '.'

const defaultOptions = () => ({
  processor: new InMemoryProcessor(),
  idGenerator: new StableIdGenerator(),
  clock: new IncrementingClock()
})

function createTestClient (optionOverrides: Partial<ClientOptions> = {}): BugsnagPerformance {
  return createClient({ ...defaultOptions(), ...optionOverrides })
}

export default createTestClient
