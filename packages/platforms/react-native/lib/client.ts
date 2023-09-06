import { InMemoryPersistence, createClient } from '@bugsnag/core-performance'
import createFetchDeliveryFactory from '@bugsnag/delivery-fetch-performance'
import createClock from './clock'
import createSchema from './config'
import idGenerator from './id-generator'
import resourceAttributesSource from './resource-attributes-source'
import spanAttributesSource from './span-attributes-source'
import { AppStartPlugin } from './auto-instrumentation/app-start-plugin'
import { AppRegistry } from 'react-native'
import { platformExtensions } from './platform-extensions'

const clock = createClock(performance)
const appStartTime = clock.now()
const deliveryFactory = createFetchDeliveryFactory(fetch, clock)

const BugsnagPerformance = createClient({
  backgroundingListener: { onStateChange: () => {} },
  clock,
  deliveryFactory,
  idGenerator,
  persistence: new InMemoryPersistence(),
  plugins: (spanFactory, spanContextStorage) => [new AppStartPlugin(appStartTime, spanFactory, clock, AppRegistry)],
  resourceAttributesSource,
  schema: createSchema(),
  spanAttributesSource,
  platformExtensions
})

export default BugsnagPerformance
