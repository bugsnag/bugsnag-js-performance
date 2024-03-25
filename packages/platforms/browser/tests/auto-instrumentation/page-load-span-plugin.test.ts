/**
 * @jest-environment jsdom
 * @jest-environment-options { "referrer": "https://bugsnag.com", "url": "https://bugsnag.com/initial-route" }
 */

import { spanContextEquals } from '@bugsnag/core-performance'
import {
  ControllableBackgroundingListener,
  InMemoryDelivery,
  IncrementingClock,
  IncrementingIdGenerator,
  VALID_API_KEY,
  createTestClient
} from '@bugsnag/js-performance-test-utilities'
import { FullPageLoadPlugin } from '../../lib/auto-instrumentation/full-page-load-plugin'
import { createSchema, type BrowserConfiguration, type BrowserSchema } from '../../lib/config'
import { type OnSettle } from '../../lib/on-settle'
import { WebVitals } from '../../lib/web-vitals'
import {
  PerformanceFake,
  PerformanceObserverManager,
  createLargestContentfulPaintFake,
  createLayoutShiftFake,
  createPerformanceEventTimingFake,
  createPerformanceNavigationTimingFake,
  createPerformancePaintTimingFake
} from '../utilities'
import MockRoutingProvider from '../utilities/mock-routing-provider'

jest.useFakeTimers()

describe('FullPageLoadPlugin', () => {
  it('Automatically creates and delivers a pageLoadSpan', async () => {
    const manager = new PerformanceObserverManager()

    const performance = new PerformanceFake()
    performance.addEntry(createPerformanceNavigationTimingFake({ responseStart: 0.5 }))
    performance.addEntry(createPerformancePaintTimingFake({ startTime: 128 }))
    performance.addEntry(createPerformanceEventTimingFake({ startTime: 0.4, processingStart: 1 }))

    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => {
      Promise.resolve().then(() => { onSettleCallback(1234) })
    }
    const webVitals = new WebVitals(performance, clock, manager.createPerformanceObserverFakeClass())
    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      clock,
      deliveryFactory: () => delivery,
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      plugins: (spanFactory) => [
        new FullPageLoadPlugin(
          document,
          window.location,
          spanFactory,
          webVitals,
          onSettle,
          new ControllableBackgroundingListener(),
          performance
        )
      ]
    })

    // largest contentful paint
    manager.queueEntry(createLargestContentfulPaintFake({ startTime: 64 }))

    // cumulative layout shift
    // session window 1: should be ignored as there's a later session window
    manager.queueEntry(createLayoutShiftFake({ startTime: 1_000, value: 100 }))
    manager.queueEntry(createLayoutShiftFake({ startTime: 1_100, value: 200 }))
    manager.queueEntry(createLayoutShiftFake({ startTime: 1_200, value: 300 }))

    // session window 2: should be ignored as there's a later session window
    manager.queueEntry(createLayoutShiftFake({ startTime: 5_000, value: 999 }))

    // session window 3: should be included as it's the latest session window
    manager.queueEntry(createLayoutShiftFake({ startTime: 20_000, value: 10 }))
    manager.queueEntry(createLayoutShiftFake({ startTime: 20_100, value: 20 }))
    manager.queueEntry(createLayoutShiftFake({ startTime: 20_200, value: 30 }))

    manager.flushQueue()

    document.title = 'Full page load'

    testClient.start({ apiKey: VALID_API_KEY })

    document.title = 'Updated title'

    await jest.runOnlyPendingTimersAsync()

    expect(delivery).toHaveSentSpan(expect.objectContaining({ name: '[FullPageLoad]/initial-route' }))

    const spans = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans
    const span = spans[spans.length - 1]

    expect(span).toHaveAttribute('bugsnag.span.category', 'full_page_load')
    expect(span).toHaveAttribute('bugsnag.browser.page.route', '/initial-route')
    expect(span).toHaveAttribute('bugsnag.browser.page.referrer', 'https://bugsnag.com/')
    expect(span).toHaveAttribute('bugsnag.browser.page.url', 'https://bugsnag.com/initial-route')
    expect(span).toHaveAttribute('bugsnag.browser.page.title', 'Updated title')
    expect(span).toHaveAttribute('bugsnag.metrics.cls', 60)

    expect(span).toHaveEvent('fcp', '128000000')
    expect(span).toHaveEvent('ttfb', '500000')
    expect(span).toHaveEvent('fid_start', '400000')
    expect(span).toHaveEvent('fid_end', '1000000')
    expect(span).toHaveEvent('lcp', '64000000')
  })

  it('Does not create a pageLoadSpan with autoInstrumentFullPageLoads set to false', async () => {
    const clock = new IncrementingClock()
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(1234) }
    const manager = new PerformanceObserverManager()
    const performance = new PerformanceFake()
    const Observer = manager.createPerformanceObserverFakeClass()
    const webVitals = new WebVitals(new PerformanceFake(), clock, Observer)
    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      deliveryFactory: () => delivery,
      plugins: (spanFactory) => [
        new FullPageLoadPlugin(
          document,
          window.location,
          spanFactory,
          webVitals,
          onSettle,
          new ControllableBackgroundingListener(),
          performance
        )
      ]
    })

    testClient.start({ apiKey: VALID_API_KEY, autoInstrumentFullPageLoads: false })

    await jest.runOnlyPendingTimersAsync()

    expect(delivery.requests).toHaveLength(0)
  })

  it('does not create a span when the page is backgrounded before start', async () => {
    const clock = new IncrementingClock()
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(1234) }
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const webVitals = new WebVitals(new PerformanceFake(), clock, Observer)
    const backgroundingListener = new ControllableBackgroundingListener()
    const performance = new PerformanceFake()

    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      deliveryFactory: () => delivery,
      backgroundingListener,
      plugins: (spanFactory) => [
        new FullPageLoadPlugin(
          document,
          window.location,
          spanFactory,
          webVitals,
          onSettle,
          backgroundingListener,
          performance
        )
      ]
    })

    backgroundingListener.sendToBackground()

    testClient.start({ apiKey: VALID_API_KEY })

    await jest.runOnlyPendingTimersAsync()

    expect(delivery.requests).toHaveLength(0)
  })

  it('does not create a span when the page is backgrounded before start and returned to foreground', async () => {
    const clock = new IncrementingClock()
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(1234) }
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const webVitals = new WebVitals(new PerformanceFake(), clock, Observer)
    const backgroundingListener = new ControllableBackgroundingListener()
    const performance = new PerformanceFake()

    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      deliveryFactory: () => delivery,
      backgroundingListener,
      plugins: (spanFactory) => [
        new FullPageLoadPlugin(
          document,
          window.location,
          spanFactory,
          webVitals,
          onSettle,
          backgroundingListener,
          performance
        )
      ]
    })

    backgroundingListener.sendToBackground()
    backgroundingListener.sendToForeground()

    testClient.start({ apiKey: VALID_API_KEY })

    await jest.runOnlyPendingTimersAsync()

    expect(delivery.requests).toHaveLength(0)
  })

  it('does not create a span when the page is backgrounded after start but before settle', async () => {
    const clock = new IncrementingClock()
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => {
      Promise.resolve().then(() => { onSettleCallback(1234) })
    }
    const manager = new PerformanceObserverManager()
    const performance = new PerformanceFake()
    const Observer = manager.createPerformanceObserverFakeClass()
    const webVitals = new WebVitals(new PerformanceFake(), clock, Observer)
    const backgroundingListener = new ControllableBackgroundingListener()

    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      deliveryFactory: () => delivery,
      backgroundingListener,
      plugins: (spanFactory) => [
        new FullPageLoadPlugin(
          document,
          window.location,
          spanFactory,
          webVitals,
          onSettle,
          backgroundingListener,
          performance
        )
      ]
    })

    testClient.start({ apiKey: VALID_API_KEY })

    backgroundingListener.sendToBackground()

    await jest.runOnlyPendingTimersAsync()

    expect(delivery.requests).toHaveLength(0)
  })

  it('does not create a span when the page is backgrounded after start but before settle and returned to foreground', async () => {
    const clock = new IncrementingClock()
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => {
      Promise.resolve().then(() => { onSettleCallback(1234) })
    }
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const webVitals = new WebVitals(new PerformanceFake(), clock, Observer)
    const backgroundingListener = new ControllableBackgroundingListener()
    const performance = new PerformanceFake()

    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      deliveryFactory: () => delivery,
      backgroundingListener,
      plugins: (spanFactory) => [
        new FullPageLoadPlugin(
          document,
          window.location,
          spanFactory,
          webVitals,
          onSettle,
          backgroundingListener,
          performance
        )
      ]
    })

    testClient.start({ apiKey: VALID_API_KEY })

    backgroundingListener.sendToBackground()
    backgroundingListener.sendToForeground()

    await jest.runOnlyPendingTimersAsync()

    expect(delivery.requests).toHaveLength(0)
  })

  it('creates a span when the page is backgrounded after settle', async () => {
    const clock = new IncrementingClock()
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => {
      Promise.resolve().then(() => { onSettleCallback(1234) })
    }
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const webVitals = new WebVitals(new PerformanceFake(), clock, Observer)
    const backgroundingListener = new ControllableBackgroundingListener()
    const performance = new PerformanceFake()

    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      deliveryFactory: () => delivery,
      backgroundingListener,
      plugins: (spanFactory) => [
        new FullPageLoadPlugin(
          document,
          window.location,
          spanFactory,
          webVitals,
          onSettle,
          backgroundingListener,
          performance
        )
      ]
    })

    testClient.start({ apiKey: VALID_API_KEY })

    await jest.runOnlyPendingTimersAsync()

    backgroundingListener.sendToBackground()

    expect(delivery).toHaveSentSpan(expect.objectContaining({ name: '[FullPageLoad]/initial-route' }))
  })

  it('can use a custom route resolver', async () => {
    const clock = new IncrementingClock()
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => {
      Promise.resolve().then(() => { onSettleCallback(1234) })
    }
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const webVitals = new WebVitals(new PerformanceFake(), clock, Observer)
    const backgroundingListener = new ControllableBackgroundingListener()
    const performance = new PerformanceFake()

    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      deliveryFactory: () => delivery,
      backgroundingListener,
      plugins: (spanFactory) => [
        new FullPageLoadPlugin(
          document,
          window.location,
          spanFactory,
          webVitals,
          onSettle,
          backgroundingListener,
          performance
        )
      ]
    })

    testClient.start({
      apiKey: VALID_API_KEY,
      routingProvider: {
        resolveRoute (url: URL): string {
          return `a route name for ${url.pathname}`
        },

        listenForRouteChanges (startRouteChangeSpan): void {}
      }
    })

    await jest.runOnlyPendingTimersAsync()

    backgroundingListener.sendToBackground()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[FullPageLoad]a route name for /initial-route'
    }))
  })

  it('falls back to the default route resolver if custom routing provider does not return a route', async () => {
    const clock = new IncrementingClock()
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => {
      Promise.resolve().then(() => { onSettleCallback(1234) })
    }
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const webVitals = new WebVitals(new PerformanceFake(), clock, Observer)
    const backgroundingListener = new ControllableBackgroundingListener()
    const performance = new PerformanceFake()

    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      deliveryFactory: () => delivery,
      backgroundingListener,
      plugins: (spanFactory) => [
        new FullPageLoadPlugin(
          document,
          window.location,
          spanFactory,
          webVitals,
          onSettle,
          backgroundingListener,
          performance
        )
      ]
    })

    testClient.start({
      apiKey: VALID_API_KEY,
      routingProvider: {
        resolveRoute (url: URL): string {
          return ''
        },

        listenForRouteChanges (startRouteChangeSpan): void {}
      }
    })

    await jest.runOnlyPendingTimersAsync()

    backgroundingListener.sendToBackground()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[FullPageLoad]/initial-route'
    }))
  })

  it('becomes the current span context on start', async () => {
    const clock = new IncrementingClock()
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => {
      Promise.resolve().then(() => { onSettleCallback(1234) })
    }
    const performance = new PerformanceFake()
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const webVitals = new WebVitals(performance, clock, Observer)
    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      idGenerator: new IncrementingIdGenerator(),
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      deliveryFactory: () => delivery,
      plugins: (spanFactory) => [
        new FullPageLoadPlugin(
          document,
          window.location,
          spanFactory,
          webVitals,
          onSettle,
          new ControllableBackgroundingListener(),
          performance
        )
      ]
    })

    // the page load span should be started when we call start
    testClient.start({ apiKey: VALID_API_KEY })
    expect(testClient.currentSpanContext).not.toBeUndefined()

    // we're using the incrementing ID generator so the page load span should have an ID and trace ID of 1
    const pageLoadSpanContext = { id: 'span ID 1', traceId: 'trace ID 1', isValid: () => true, samplingRate: 0.1 }
    expect(spanContextEquals(pageLoadSpanContext, testClient.currentSpanContext)).toBe(true)

    // start and end a new span - this should become a child of the page load span
    const childSpan = testClient.startSpan('child of page load span')
    childSpan.end()

    // trigger the onsettle to end the page load span
    await jest.runOnlyPendingTimersAsync()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[FullPageLoad]/initial-route',
      spanId: 'span ID 1',
      traceId: 'trace ID 1',
      parentSpanId: undefined
    }))

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: 'child of page load span',
      spanId: 'span ID 2',
      traceId: 'trace ID 1', // trace ID should match the page load span trace ID
      parentSpanId: 'span ID 1' // parentSpanId should match the page load span ID
    }))
  })

  it('starts a new root span if there is already an open span context', async () => {
    const clock = new IncrementingClock()
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => {
      Promise.resolve().then(() => { onSettleCallback(1234) })
    }
    const performance = new PerformanceFake()
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const webVitals = new WebVitals(performance, clock, Observer)
    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      idGenerator: new IncrementingIdGenerator(),
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      deliveryFactory: () => delivery,
      plugins: (spanFactory) => [
        new FullPageLoadPlugin(
          document,
          window.location,
          spanFactory,
          webVitals,
          onSettle,
          new ControllableBackgroundingListener(),
          performance
        )
      ]
    })

    // start a custom root span before calling start
    const customRootSpan = testClient.startSpan('custom root span')
    expect(spanContextEquals(customRootSpan, testClient.currentSpanContext)).toBe(true)

    testClient.start({ apiKey: VALID_API_KEY })

    // trigger the onsettle to end the page load span
    await jest.runOnlyPendingTimersAsync()

    // end the custrom root span
    customRootSpan.end()
    await jest.runOnlyPendingTimersAsync()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: 'custom root span',
      spanId: 'span ID 1',
      traceId: 'trace ID 1',
      parentSpanId: undefined
    }))

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[FullPageLoad]/initial-route',
      spanId: 'span ID 2',
      traceId: 'trace ID 2',
      parentSpanId: undefined // page load span should have no parent
    }))
  })

  it('blocks span attributes based on sendPageAttributes config', async () => {
    const performance = new PerformanceFake()
    const manager = new PerformanceObserverManager()
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => { Promise.resolve().then(() => { onSettleCallback(1234) }) }
    const webVitals = new WebVitals(performance, clock, manager.createPerformanceObserverFakeClass())
    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      clock,
      deliveryFactory: () => delivery,
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      plugins: (spanFactory) => [
        new FullPageLoadPlugin(
          document,
          window.location,
          spanFactory,
          webVitals,
          onSettle,
          new ControllableBackgroundingListener(),
          performance
        )
      ]
    })

    testClient.start({ apiKey: VALID_API_KEY, sendPageAttributes: { url: false, referrer: false, title: false } })

    await jest.runOnlyPendingTimersAsync()

    expect(delivery).toHaveSentSpan(expect.objectContaining({ name: '[FullPageLoad]/initial-route' }))

    const spans = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans
    const span = spans[spans.length - 1]

    expect(span).toHaveAttribute('bugsnag.span.category', 'full_page_load')
    expect(span).toHaveAttribute('bugsnag.browser.page.route', '/initial-route')

    // excluded by spendPageAttributes
    expect(span).not.toHaveAttribute('bugsnag.browser.page.referrer')
    expect(span).not.toHaveAttribute('bugsnag.browser.page.url')
    expect(span).not.toHaveAttribute('bugsnag.browser.page.title')
  })
  describe('WebVitals', () => {
    describe('lcp', () => {
      it('uses the latest lcp entry (multiple entries)', async () => {
        const manager = new PerformanceObserverManager()
        const performance = new PerformanceFake()

        const clock = new IncrementingClock('1970-01-01T00:00:00Z')
        const delivery = new InMemoryDelivery()
        const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(1234) }
        const webVitals = new WebVitals(performance, clock, manager.createPerformanceObserverFakeClass())
        const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
          clock,
          deliveryFactory: () => delivery,
          schema: createSchema(window.location.hostname, new MockRoutingProvider()),
          plugins: (spanFactory) => [
            new FullPageLoadPlugin(
              document,
              window.location,
              spanFactory,
              webVitals,
              onSettle,
              new ControllableBackgroundingListener(),
              performance
            )
          ]
        })

        // LCP events
        manager.queueEntry(createLargestContentfulPaintFake({ startTime: 8 }))
        manager.queueEntry(createLargestContentfulPaintFake({ startTime: 16 }))
        manager.queueEntry(createLargestContentfulPaintFake({ startTime: 64 }))
        manager.queueEntry(createLargestContentfulPaintFake({ startTime: 32 }))
        manager.flushQueue()

        testClient.start({ apiKey: VALID_API_KEY })

        await jest.runOnlyPendingTimersAsync()

        expect(delivery).toHaveSentSpan(expect.objectContaining({
          name: '[FullPageLoad]/initial-route',
          events: [
            {
              name: 'lcp',
              timeUnixNano: '32000000'
            }
          ]
        }))
      })

      it('uses the latest lcp entry (multiple batches)', async () => {
        const manager = new PerformanceObserverManager()
        const performance = new PerformanceFake()

        const clock = new IncrementingClock('1970-01-01T00:00:00Z')
        const delivery = new InMemoryDelivery()
        const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(1234) }
        const webVitals = new WebVitals(performance, clock, manager.createPerformanceObserverFakeClass())
        const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
          clock,
          deliveryFactory: () => delivery,
          schema: createSchema(window.location.hostname, new MockRoutingProvider()),
          plugins: (spanFactory) => [
            new FullPageLoadPlugin(
              document,
              window.location,
              spanFactory,
              webVitals,
              onSettle,
              new ControllableBackgroundingListener(),
              performance
            )
          ]
        })

        // LCP events
        manager.queueEntry(createLargestContentfulPaintFake({ startTime: 8 }))
        manager.queueEntry(createLargestContentfulPaintFake({ startTime: 16 }))
        manager.flushQueue()

        manager.queueEntry(createLargestContentfulPaintFake({ startTime: 64 }))
        manager.queueEntry(createLargestContentfulPaintFake({ startTime: 32 }))
        manager.flushQueue()

        manager.queueEntry(createLargestContentfulPaintFake({ startTime: 64 }))
        manager.queueEntry(createLargestContentfulPaintFake({ startTime: 128 }))
        manager.flushQueue()

        testClient.start({ apiKey: VALID_API_KEY })

        await jest.runOnlyPendingTimersAsync()

        expect(delivery).toHaveSentSpan(expect.objectContaining({
          name: '[FullPageLoad]/initial-route',
          events: [
            {
              name: 'lcp',
              timeUnixNano: '128000000'
            }
          ]
        }))
      })

      it('handles there being no lcp entry', async () => {
        const manager = new PerformanceObserverManager()
        const performance = new PerformanceFake()

        const clock = new IncrementingClock('1970-01-01T00:00:00Z')
        const delivery = new InMemoryDelivery()
        const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(1234) }
        const webVitals = new WebVitals(performance, clock, manager.createPerformanceObserverFakeClass())
        const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
          clock,
          deliveryFactory: () => delivery,
          schema: createSchema(window.location.hostname, new MockRoutingProvider()),
          plugins: (spanFactory) => [
            new FullPageLoadPlugin(
              document,
              window.location,
              spanFactory,
              webVitals,
              onSettle,
              new ControllableBackgroundingListener(),
              performance
            )
          ]
        })

        // it's an empty queue, but there's no harm in flushing
        manager.flushQueue()

        testClient.start(VALID_API_KEY)

        await jest.runOnlyPendingTimersAsync()

        expect(delivery).toHaveSentSpan(expect.objectContaining({
          name: '[FullPageLoad]/initial-route',
          events: []
        }))

        const span = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]

        expect(span).not.toHaveEvent('lcp')
      })
    })

    it('handles PerformanceObserver not being available', async () => {
      const performance = new PerformanceFake()

      const clock = new IncrementingClock('1970-01-01T00:00:00Z')
      const delivery = new InMemoryDelivery()
      const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(1234) }
      const webVitals = new WebVitals(performance, clock, undefined)
      const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
        clock,
        deliveryFactory: () => delivery,
        schema: createSchema(window.location.hostname, new MockRoutingProvider()),
        plugins: (spanFactory) => [
          new FullPageLoadPlugin(
            document,
            window.location,
            spanFactory,
            webVitals,
            onSettle,
            new ControllableBackgroundingListener(),
            performance
          )
        ]
      })

      testClient.start({ apiKey: VALID_API_KEY })

      await jest.runOnlyPendingTimersAsync()

      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: '[FullPageLoad]/initial-route',
        events: []
      }))
    })
  })
})
