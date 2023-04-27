import {
  ControllableBackgroundingListener,
  IncrementingClock,
  InMemoryDelivery,
  resourceAttributesSource,
  spanAttributesSource,
  StableIdGenerator
} from '.'

import {
  createClient,
  schema,
  type BugsnagPerformance,
  type ClientOptions,
  type CoreSchema
} from '@bugsnag/js-performance-core'

const defaultOptions = () => ({
  backgroundingListener: new ControllableBackgroundingListener(),
  deliveryFactory: () => new InMemoryDelivery(),
  idGenerator: new StableIdGenerator(),
  clock: new IncrementingClock(),
  resourceAttributesSource,
  spanAttributesSource,
  schema,
  plugins: () => []
})

function createTestClient (optionOverrides: Partial<ClientOptions<CoreSchema>> = {}): BugsnagPerformance<CoreSchema> {
  return createClient({ ...defaultOptions(), ...optionOverrides })
}

export default createTestClient
