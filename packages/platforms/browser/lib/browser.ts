import { createClient } from '@bugsnag/js-performance-core'
import { FullPageLoadPlugin, RouteChangePlugin } from './auto-instrumentation'
import createBrowserBackgroundingListener from './backgrounding-listener'
import createClock from './clock'
import { createSchema } from './config'
import createBrowserDeliveryFactory from './delivery'
import idGenerator from './id-generator'
import createResourceAttributesSource from './resource-attributes-source'
import createSpanAttributesSource from './span-attributes-source'

const clock = createClock(performance)
const spanAttributesSource = createSpanAttributesSource(document.title, window.location.href)
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
  plugins: (spanFactory) => [
    new FullPageLoadPlugin(document, window.location, spanFactory),
    new RouteChangePlugin(spanFactory)
  ]
})

export default BugsnagPerformance
