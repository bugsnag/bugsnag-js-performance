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
const backgroundingListener = createBrowserBackgroundingListener(document)

const BugsnagPerformance = createClient({
  backgroundingListener,
  clock,
  resourceAttributesSource,
  spanAttributesSource,
  delivery: browserDelivery(window.fetch, backgroundingListener),
  idGenerator,
  schema: createSchema(window.location.hostname)
})

export default BugsnagPerformance
