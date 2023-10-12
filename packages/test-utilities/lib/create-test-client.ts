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
  InMemoryQueue,
  type BugsnagPerformance,
  type ClientOptions,
  type Configuration,
  type CoreSchema,
  type Delivery
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
  persistence: new InMemoryPersistence(),
  retryQueueFactory: (delivery: Delivery, retryQueueMaxSize: number) => new InMemoryQueue(delivery, retryQueueMaxSize)
})

function createTestClient <S extends CoreSchema, C extends Configuration, T = void> (optionOverrides: Partial<ClientOptions<S, C, T>> = {}): BugsnagPerformance<C, T> {
  return createClient({ ...defaultOptions(), ...optionOverrides })
}

export default createTestClient
