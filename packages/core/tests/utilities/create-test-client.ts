import { IncrementingClock, InMemoryProcessor, resourceAttributesSource, spanAttributesSource, StableIdGenerator } from '.'
import { schema } from '../../lib/config'
import type { BugsnagPerformance, ClientOptions } from '../../lib/core'
import { createClient } from '../../lib/core'

const defaultOptions = () => ({
  processorFactory: { create: () => new InMemoryProcessor() },
  idGenerator: new StableIdGenerator(),
  clock: new IncrementingClock(),
  resourceAttributesSource,
  spanAttributesSource,
  schema
})

function createTestClient (optionOverrides: Partial<ClientOptions> = {}): BugsnagPerformance {
  return createClient({ ...defaultOptions(), ...optionOverrides })
}

export default createTestClient
