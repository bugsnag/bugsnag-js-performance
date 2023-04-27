import { createClient } from '@bugsnag/js-performance-core'
import createBrowserBackgroundingListener from './backgrounding-listener'
import createClock from './clock'
import { createSchema } from './config'
import createBrowserDeliveryFactory from './delivery'
import idGenerator from './id-generator'
import createResourceAttributesSource from './resource-attributes-source'
import spanAttributesSource from './span-attributes-source'
import { PageLoadSpanPlugin } from './page-load-span-plugin'

const clock = createClock(performance)
const resourceAttributesSource = createResourceAttributesSource(navigator)
const backgroundingListener = createBrowserBackgroundingListener(document)

const BugsnagPerformance = createClient({
  backgroundingListener,
  clock,
  resourceAttributesSource,
  spanAttributesSource,
  deliveryFactory: createBrowserDeliveryFactory(window.fetch, backgroundingListener),
  idGenerator,
  schema: createSchema(window.location.hostname),
  plugins: (spanFactory) => [new PageLoadSpanPlugin(spanFactory)]
})

export default BugsnagPerformance
