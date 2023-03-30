import { createClient } from '@bugsnag/js-performance-core'
import createBrowserBackgroundingListener from './backgrounding-listener'
import createClock from './clock'
import { createSchema } from './config'
import browserDelivery from './delivery'
import idGenerator from './id-generator'
import createResourceAttributesSource from './resource-attributes-source'
import spanAttributesSource from './span-attributes-source'

const clock = createClock(performance)
const resourceAttributesSource = createResourceAttributesSource(navigator)

const BugsnagPerformance = createClient({
  backgroundingListener: createBrowserBackgroundingListener(document),
  clock,
  resourceAttributesSource,
  spanAttributesSource,
  delivery: browserDelivery(window.fetch),
  idGenerator,
  schema: createSchema(window.location.hostname)
})

export default BugsnagPerformance
