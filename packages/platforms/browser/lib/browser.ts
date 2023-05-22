import { createClient } from '@bugsnag/js-performance-core'
import { FullPageLoadPlugin } from './auto-instrumentation/full-page-load-plugin'
import createBrowserBackgroundingListener from './backgrounding-listener'
import createClock from './clock'
import { createSchema } from './config'
import createBrowserDeliveryFactory from './delivery'
import idGenerator from './id-generator'
import createOnSettle from './on-settle'
import createResourceAttributesSource from './resource-attributes-source'
import createSpanAttributesSource from './span-attributes-source'
import createFetchRequestTracker from './request-tracker/request-tracker-fetch'
import createXmlHttpRequestTracker from './request-tracker/request-tracker-xhr'
import { NetworkRequestPlugin } from './auto-instrumentation/network-request-plugin'
import { WebVitals } from './web-vitals'

const clock = createClock(performance)
const spanAttributesSource = createSpanAttributesSource(document.title, window.location.href)
const resourceAttributesSource = createResourceAttributesSource(navigator)
const backgroundingListener = createBrowserBackgroundingListener(document)
const fetchRequestTracker = createFetchRequestTracker(window, clock)
const xhrRequestTracker = createXmlHttpRequestTracker(window, clock)
const webVitals = new WebVitals(performance, clock, PerformanceObserver)
const onSettle = createOnSettle(
  clock,
  document,
  fetchRequestTracker,
  xhrRequestTracker,
  PerformanceObserver,
  performance
)

const BugsnagPerformance = createClient({
  backgroundingListener,
  clock,
  resourceAttributesSource,
  spanAttributesSource,
  deliveryFactory: createBrowserDeliveryFactory(window.fetch, backgroundingListener),
  idGenerator,
  schema: createSchema(window.location.hostname),
  plugins: (spanFactory) => [
    onSettle,
    new FullPageLoadPlugin(document, window.location, spanFactory, webVitals, onSettle),
    new NetworkRequestPlugin(spanFactory, fetchRequestTracker, xhrRequestTracker)
  ]
})

export default BugsnagPerformance
