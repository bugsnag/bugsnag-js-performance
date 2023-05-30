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
  plugins: () => []
})

function createTestClient <S extends CoreSchema, C extends Configuration> (optionOverrides: Partial<ClientOptions<S, C>> = {}): BugsnagPerformance<C> {
  return createClient({ ...defaultOptions(), ...optionOverrides })
}

export default createTestClient
