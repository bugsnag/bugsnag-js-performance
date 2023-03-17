import { IncrementingClock, resourceAttributesSource, spanAttributesSource, StableIdGenerator } from '.'
import { schema } from '../../lib/config'
import type { BugsnagPerformance, ClientOptions } from '../../lib/core'
import { createClient } from '../../lib/core'
import InMemoryDelivery from './in-memory-delivery'

const defaultOptions = () => ({
  delivery: new InMemoryDelivery(),
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
