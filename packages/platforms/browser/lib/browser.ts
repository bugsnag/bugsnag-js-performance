import { createClient } from '@bugsnag/core-performance'
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

const backgroundingListener = createBrowserBackgroundingListener(document)
const clock = createClock(performance, backgroundingListener)
const spanAttributesSource = createSpanAttributesSource(document.title, window.location.href)
const resourceAttributesSource = createResourceAttributesSource(navigator)
const fetchRequestTracker = createFetchRequestTracker(window, clock)
const xhrRequestTracker = createXmlHttpRequestTracker(window, clock)
const webVitals = new WebVitals(performance, clock, window.PerformanceObserver)
const onSettle = createOnSettle(
  clock,
  window,
  fetchRequestTracker,
  xhrRequestTracker,
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
    new FullPageLoadPlugin(
      document,
      window.location,
      spanFactory,
      webVitals,
      onSettle,
      backgroundingListener
    ),
    new NetworkRequestPlugin(spanFactory, fetchRequestTracker, xhrRequestTracker)
  ]
})

export default BugsnagPerformance
