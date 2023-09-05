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
  InMemoryPersistence,
  type BugsnagPerformance,
  type ClientOptions,
  type Configuration,
  type CoreSchema
} from '@bugsnag/core-performance'

const defaultOptions = () => ({
  backgroundingListener: new ControllableBackgroundingListener(),
  deliveryFactory: () => new InMemoryDelivery(),
  idGenerator: new StableIdGenerator(),
  clock: new IncrementingClock(),
  resourceAttributesSource,
  spanAttributesSource,
  schema,
  plugins: () => [],
  persistence: new InMemoryPersistence()
})

function createTestClient <S extends CoreSchema, C extends Configuration, T = void> (optionOverrides: Partial<ClientOptions<S, C, T>> = {}): BugsnagPerformance<C, T> {
  return createClient({ ...defaultOptions(), ...optionOverrides })
}

export default createTestClient
