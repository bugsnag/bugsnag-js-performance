import { createClient, createNoopClient, InMemoryQueue } from '@bugsnag/core-performance'
import type { Client } from '@bugsnag/core-performance'
import createFetchDeliveryFactory from '@bugsnag/delivery-fetch-performance'
import { createFetchRequestTracker, createXmlHttpRequestTracker } from '@bugsnag/request-tracker-performance'
import { FullPageLoadPlugin, NetworkRequestPlugin, ResourceLoadPlugin, RouteChangePlugin } from './auto-instrumentation'
import createBrowserBackgroundingListener from './backgrounding-listener'
import createClock from './clock'
import { createSchema } from './config'
import type { BrowserConfiguration } from './config'
import { createDefaultRoutingProvider, createNoopRoutingProvider } from './default-routing-provider'
import idGenerator from './id-generator'
import createOnSettle, { createNoopOnSettle } from './on-settle'
import type { OnSettlePlugin } from './on-settle'
import makeBrowserPersistence from './persistence'
import createResourceAttributesSource from './resource-attributes-source'
import createSpanAttributesSource from './span-attributes-source'
import { WebVitals } from './web-vitals'

export let onSettle: OnSettlePlugin
export let DefaultRoutingProvider: ReturnType<typeof createDefaultRoutingProvider>
let BugsnagPerformance: Client<BrowserConfiguration>

if (typeof window === 'undefined' || typeof document === 'undefined') {
  onSettle = createNoopOnSettle()
  DefaultRoutingProvider = createNoopRoutingProvider()
  BugsnagPerformance = createNoopClient()
} else {
  const isDevelopment = window.location.hostname === 'localhost'
  const backgroundingListener = createBrowserBackgroundingListener(window)
  const spanAttributesSource = createSpanAttributesSource(document)
  const clock = createClock(performance, backgroundingListener)
  const persistence = makeBrowserPersistence(window)
  const resourceAttributesSource = createResourceAttributesSource(navigator, persistence)
  const fetchRequestTracker = createFetchRequestTracker(window, clock)
  const xhrRequestTracker = createXmlHttpRequestTracker(XMLHttpRequest, clock, document)
  const webVitals = new WebVitals(performance, clock, window.PerformanceObserver)
  onSettle = createOnSettle(
    clock,
    window,
    fetchRequestTracker,
    xhrRequestTracker,
    performance
  )
  DefaultRoutingProvider = createDefaultRoutingProvider(onSettle, window.location)

  BugsnagPerformance = createClient({
    isDevelopment,
    backgroundingListener,
    clock,
    resourceAttributesSource,
    spanAttributesSource,
    deliveryFactory: createFetchDeliveryFactory(window.fetch, clock, backgroundingListener),
    idGenerator,
    schema: createSchema(new DefaultRoutingProvider(), isDevelopment),
    plugins: (spanFactory, spanContextStorage) => [
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
      // ResourceLoadPlugin should always come after FullPageLoad plugin, as it should use that
      // span context as the parent of it's spans
      new ResourceLoadPlugin(spanFactory, spanContextStorage, window.PerformanceObserver),
      new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchRequestTracker, xhrRequestTracker),
      new RouteChangePlugin(spanFactory, window.location, document)
    ],
    persistence,
    retryQueueFactory: (delivery, retryQueueMaxSize) => new InMemoryQueue(delivery, retryQueueMaxSize)
  })
}

export default BugsnagPerformance
