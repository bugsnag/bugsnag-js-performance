import { IncrementingClock, InMemoryProcessor, resourceAttributesSource, spanAttributesSource, StableIdGenerator } from '.'
import { schema, type CoreSchema } from '../../lib/config'
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

function createTestClient<Schema extends CoreSchema> (optionOverrides: Partial<ClientOptions<Schema>> = {}): BugsnagPerformance {
  return createClient({ ...defaultOptions(), ...optionOverrides })
}

export default createTestClient
