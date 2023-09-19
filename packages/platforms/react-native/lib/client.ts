import { InMemoryPersistence, InMemoryQueue, createClient } from '@bugsnag/core-performance'
import createFetchDeliveryFactory from '@bugsnag/delivery-fetch-performance'
import { AppRegistry, AppState } from 'react-native'
import { AppStartPlugin } from './auto-instrumentation/app-start-plugin'
import createClock from './clock'
import createSchema from './config'
import idGenerator from './id-generator'
import { platformExtensions } from './platform-extensions'
import resourceAttributesSourceFactory from './resource-attributes-source'
import { createSpanAttributesSource } from './span-attributes-source'

const clock = createClock(performance)
const appStartTime = clock.now()
const deliveryFactory = createFetchDeliveryFactory(fetch, clock)
const spanAttributesSource = createSpanAttributesSource(AppState)
const persistence = new InMemoryPersistence()
const resourceAttributesSource = resourceAttributesSourceFactory(persistence)

const BugsnagPerformance = createClient({
  backgroundingListener: { onStateChange: () => {} },
  clock,
  deliveryFactory,
  idGenerator,
  persistence,
  plugins: (spanFactory, spanContextStorage) => [new AppStartPlugin(appStartTime, spanFactory, clock, AppRegistry)],
  resourceAttributesSource,
  schema: createSchema(),
  spanAttributesSource,
  retryQueueFactory: (delivery, retryQueueMaxSize) => new InMemoryQueue(delivery, retryQueueMaxSize),
  platformExtensions
})

export default BugsnagPerformance
