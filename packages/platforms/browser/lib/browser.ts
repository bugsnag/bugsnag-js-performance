import { createClient } from '@bugsnag/core-performance'
import { FullPageLoadPlugin, NetworkRequestPlugin, ResourceLoadPlugin, RouteChangePlugin } from './auto-instrumentation'
import createBrowserBackgroundingListener from './backgrounding-listener'
import createClock from './clock'
import { createSchema } from './config'
import { createDefaultRoutingProvider } from './default-routing-provider'
import createBrowserDeliveryFactory from './delivery'
import idGenerator from './id-generator'
import makeBrowserPersistence from './persistence'
import createOnSettle from './on-settle'
import createFetchRequestTracker from './request-tracker/request-tracker-fetch'
import createXmlHttpRequestTracker from './request-tracker/request-tracker-xhr'
import createResourceAttributesSource from './resource-attributes-source'
import createSpanAttributesSource from './span-attributes-source'
import { WebVitals } from './web-vitals'

const backgroundingListener = createBrowserBackgroundingListener(document)
const clock = createClock(performance, backgroundingListener)
const persistence = makeBrowserPersistence(window)
const spanAttributesSource = createSpanAttributesSource(document.title, window.location.href)
const resourceAttributesSource = createResourceAttributesSource(navigator, persistence)
const fetchRequestTracker = createFetchRequestTracker(window, clock)
const xhrRequestTracker = createXmlHttpRequestTracker(window, clock)
const webVitals = new WebVitals(performance, clock, window.PerformanceObserver)
export const onSettle = createOnSettle(
  clock,
  window,
  fetchRequestTracker,
  xhrRequestTracker,
  performance
)
export const DefaultRoutingProvider = createDefaultRoutingProvider(onSettle, window.location)

const BugsnagPerformance = createClient({
  backgroundingListener,
  clock,
  resourceAttributesSource,
  spanAttributesSource,
  deliveryFactory: createBrowserDeliveryFactory(window.fetch, backgroundingListener),
  idGenerator,
  schema: createSchema(window.location.hostname, new DefaultRoutingProvider()),
  plugins: (spanFactory) => [
    onSettle,
    new FullPageLoadPlugin(
      document,
      window.location,
      spanFactory,
      webVitals,
      onSettle,
      backgroundingListener,
      performance
    ),
    new NetworkRequestPlugin(spanFactory, fetchRequestTracker, xhrRequestTracker),
    new RouteChangePlugin(spanFactory, window.location),
    new ResourceLoadPlugin(spanFactory, window.PerformanceObserver)
  ],
  persistence
})

export default BugsnagPerformance
