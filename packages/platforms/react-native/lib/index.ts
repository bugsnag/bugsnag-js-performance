import { InMemoryPersistence, createClient } from '@bugsnag/core-performance'
import createFetchDeliveryFactory from '@bugsnag/delivery-fetch-performance'
import createClock from './clock'
import createSchema from './config'
import idGenerator from './id-generator'
import resourceAttributesSource from './resource-attributes-source'
import spanAttributesSource from './span-attributes-source'

const clock = createClock(performance)
const deliveryFactory = createFetchDeliveryFactory(fetch, clock)

const BugsnagPerformance = createClient({
  backgroundingListener: { onStateChange: () => {} },
  clock,
  deliveryFactory,
  idGenerator,
  persistence: new InMemoryPersistence(),
  plugins: (spanFactory, spanContextStorage) => [],
  resourceAttributesSource,
  schema: createSchema(),
  spanAttributesSource
})

export default BugsnagPerformance
