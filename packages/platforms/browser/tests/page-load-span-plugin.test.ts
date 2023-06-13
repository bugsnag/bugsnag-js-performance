/**
 * @jest-environment jsdom
 * @jest-environment-options { "referrer": "https://bugsnag.com" }
 */

import {
  ControllableBackgroundingListener,
  InMemoryDelivery,
  IncrementingClock,
  VALID_API_KEY,
  createTestClient
} from '@bugsnag/js-performance-test-utilities'
import {
  PerformanceFake,
  PerformanceObserverManager,
  createPerformanceNavigationTimingFake,
  createPerformancePaintTimingFake,
  createPerformanceEventTimingFake,
  createLayoutShiftFake,
  createLargestContentfulPaintFake
} from './utilities'
import { FullPageLoadPlugin } from '../lib/auto-instrumentation/full-page-load-plugin'
import { createSchema } from '../lib/config'
import { type OnSettle } from '../lib/on-settle'
import { WebVitals } from '../lib/web-vitals'
import MockRoutingProvider from './utilities/mock-routing-provider'

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
    const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(1234) }
    const webVitals = new WebVitals(performance, clock, manager.createPerformanceObserverFakeClass())
    const testClient = createTestClient({
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
          new ControllableBackgroundingListener()
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

    testClient.start({ apiKey: VALID_API_KEY })

    await jest.runOnlyPendingTimersAsync()

    expect(delivery).toHaveSentSpan(expect.objectContaining({ name: '[FullPageLoad]/initial-route' }))

    const span = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]

    expect(span).toHaveAttribute('bugsnag.span.category', 'full_page_load')
    expect(span).toHaveAttribute('bugsnag.browser.page.route', '/initial-route')
    expect(span).toHaveAttribute('bugsnag.browser.page.referrer', 'https://bugsnag.com/')
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
    const Observer = manager.createPerformanceObserverFakeClass()
    const webVitals = new WebVitals(new PerformanceFake(), clock, Observer)
    const testClient = createTestClient({
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      deliveryFactory: () => delivery,
      plugins: (spanFactory) => [
        new FullPageLoadPlugin(
          document,
          window.location,
          spanFactory,
          webVitals,
          onSettle,
          new ControllableBackgroundingListener()
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

    const testClient = createTestClient({
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
          backgroundingListener
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

    const testClient = createTestClient({
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
          backgroundingListener
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
    const Observer = manager.createPerformanceObserverFakeClass()
    const webVitals = new WebVitals(new PerformanceFake(), clock, Observer)
    const backgroundingListener = new ControllableBackgroundingListener()

    const testClient = createTestClient({
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
          backgroundingListener
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

    const testClient = createTestClient({
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
          backgroundingListener
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

    const testClient = createTestClient({
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
          backgroundingListener
        )
      ]
    })

    testClient.start({ apiKey: VALID_API_KEY })

    await jest.runOnlyPendingTimersAsync()

    backgroundingListener.sendToBackground()

    expect(delivery).toHaveSentSpan(expect.objectContaining({ name: '[FullPageLoad]/initial-route' }))
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
        const testClient = createTestClient({
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
              new ControllableBackgroundingListener()
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
        const testClient = createTestClient({
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
              new ControllableBackgroundingListener()
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
        const testClient = createTestClient({
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
              new ControllableBackgroundingListener()
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
      const testClient = createTestClient({
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
            new ControllableBackgroundingListener()
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
