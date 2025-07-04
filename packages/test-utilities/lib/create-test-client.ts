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
  InMemoryQueue

} from '@bugsnag/core-performance'
import type { BugsnagPerformance, ClientOptions, Configuration, CoreSchema, Delivery } from '@bugsnag/core-performance'
import type { AppState } from '../../core/lib/app-state'

const defaultOptions = () => ({
  backgroundingListener: new ControllableBackgroundingListener(),
  deliveryFactory: () => new InMemoryDelivery(),
  idGenerator: new StableIdGenerator(),
  clock: new IncrementingClock(),
  resourceAttributesSource,
  spanAttributesSource,
  schema,
  plugins: () => [],
  appState: 'starting',
  setAppState: (appState: AppState) => appState,
  persistence: new InMemoryPersistence(),
  retryQueueFactory: (delivery: Delivery, retryQueueMaxSize: number) =>
    new InMemoryQueue(delivery, retryQueueMaxSize)
})

function createTestClient <S extends CoreSchema, C extends Configuration, T = void> (optionOverrides: Partial<ClientOptions<S, C, T>> = {}): BugsnagPerformance<C, T> {
  return createClient({ ...defaultOptions(), ...optionOverrides })
}

export default createTestClient
