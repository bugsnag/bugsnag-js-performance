import { IncrementingClock, InMemoryProcessor, resourceAttributesSource, spanAttributesSource, StableIdGenerator } from '.'
import type { BugsnagPerformance, ClientOptions } from '../../lib/core'
import { createClient } from '../../lib/core'

const defaultOptions = () => ({
  processor: new InMemoryProcessor(),
  idGenerator: new StableIdGenerator(),
  clock: new IncrementingClock(),
  resourceAttributesSource,
  spanAttributesSource
})

function createTestClient (optionOverrides: Partial<ClientOptions> = {}): BugsnagPerformance {
  return createClient({ ...defaultOptions(), ...optionOverrides })
}

export default createTestClient
