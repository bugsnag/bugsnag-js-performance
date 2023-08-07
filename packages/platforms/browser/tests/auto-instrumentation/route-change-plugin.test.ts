/**
 * @jest-environment jsdom
 * @jest-environment-options { "url": "https://bugsnag.com/route-change-plugin" }
 */

import { InMemoryDelivery, IncrementingClock, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { RouteChangePlugin } from '../../lib/auto-instrumentation/route-change-plugin'
import { createSchema, type BrowserConfiguration, type BrowserSchema } from '../../lib/config'
import { createDefaultRoutingProvider } from '../../lib/routing-provider/default-routing-provider'
import { type OnSettle } from '../../lib/on-settle'
import { type StartRouteChangeCallback } from '../../lib/routing-provider'

jest.useFakeTimers()

const jestLogger = {
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}

const mockOnSettle: OnSettle = (onSettleCallback) => {
  Promise.resolve().then(() => { onSettleCallback(32) })
}

afterEach(() => {
  history.replaceState({}, 'unused', 'https://bugsnag.com/route-change-plugin')
  jest.clearAllTimers()
  jest.clearAllMocks()
})

describe('RouteChangePlugin', () => {
  it.each([
    { type: 'URL', url: new URL('https://bugsnag.com/second-route') },
    { type: 'string (absolute URL)', url: 'https://bugsnag.com/second-route' },
    { type: 'string (relative URL)', url: '/second-route' }
  ])('creates a route change span on pushState with $type', async ({ url }) => {
    const DefaultRoutingProvider = createDefaultRoutingProvider(mockOnSettle, window.location)
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()

    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      clock,
      deliveryFactory: () => delivery,
      schema: createSchema(window.location.hostname, new DefaultRoutingProvider()),
      plugins: (spanFactory) => [new RouteChangePlugin(spanFactory, window.location, document)]
    })

    document.title = 'Title 1'

    testClient.start({ apiKey: VALID_API_KEY })

    document.title = 'Title 2'

    history.pushState({}, '', url)

    document.title = 'Title 3'

    await jest.runOnlyPendingTimersAsync()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[RouteChange]/second-route',
      startTimeUnixNano: '1000000',
      endTimeUnixNano: '32000000'
    }))

    const span = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]
    expect(span).toHaveAttribute('bugsnag.span.category', 'route_change')
    expect(span).toHaveAttribute('bugsnag.browser.page.route', '/second-route')
    expect(span).toHaveAttribute('bugsnag.browser.page.url', 'https://bugsnag.com/second-route')
    expect(span).toHaveAttribute('bugsnag.browser.page.title', 'Title 3')
    expect(span).toHaveAttribute('bugsnag.browser.page.previous_route', '/route-change-plugin')
    expect(span).toHaveAttribute('bugsnag.browser.page.route_change.trigger', 'pushState')
  })

  it('creates a route change span on popstate', async () => {
    const DefaultRoutingProvider = createDefaultRoutingProvider(mockOnSettle, window.location)
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()

    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      clock,
      deliveryFactory: () => delivery,
      schema: createSchema(window.location.hostname, new DefaultRoutingProvider()),
      plugins: (spanFactory) => [new RouteChangePlugin(spanFactory, window.location, document)]
    })

    history.pushState({}, '', '/first-route')
    history.pushState({}, '', '/second-route')
    testClient.start({ apiKey: VALID_API_KEY })

    history.back()
    jest.runAllTimers()
    await jest.runOnlyPendingTimersAsync()

    const firstSpan = expect.objectContaining({
      name: '[RouteChange]/first-route',
      startTimeUnixNano: '1000000',
      endTimeUnixNano: '32000000'
    })

    const secondSpan = expect.objectContaining({
      name: '[RouteChange]/second-route',
      startTimeUnixNano: '2000000',
      endTimeUnixNano: '32000000'
    })

    expect(delivery).toHaveSentSpan(firstSpan)
    expect(delivery).not.toHaveSentSpan(secondSpan)

    const firstRouteSpan = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]
    expect(firstRouteSpan).toHaveAttribute('bugsnag.span.category', 'route_change')
    expect(firstRouteSpan).toHaveAttribute('bugsnag.browser.page.route', '/first-route')
    expect(firstRouteSpan).toHaveAttribute('bugsnag.browser.page.url', 'https://bugsnag.com/first-route')
    expect(firstRouteSpan).toHaveAttribute('bugsnag.browser.page.previous_route', '/second-route')
    expect(firstRouteSpan).toHaveAttribute('bugsnag.browser.page.route_change.trigger', 'popstate')

    history.forward()
    jest.runAllTimers()
    await jest.runOnlyPendingTimersAsync()

    expect(delivery).toHaveSentSpan(secondSpan)

    const secondRouteSpan = delivery.requests[1].resourceSpans[0].scopeSpans[0].spans[0]
    expect(secondRouteSpan).toHaveAttribute('bugsnag.span.category', 'route_change')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.browser.page.route', '/second-route')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.browser.page.url', 'https://bugsnag.com/second-route')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.browser.page.previous_route', '/first-route')
    expect(firstRouteSpan).toHaveAttribute('bugsnag.browser.page.route_change.trigger', 'popstate')
  })

  it.each([
    { type: 'empty string', url: '' },
    { type: 'undefined', url: undefined },
    { type: 'null', url: null }
  ])('does not create a route change span on pushState with $type', async ({ url }) => {
    const DefaultRoutingProvider = createDefaultRoutingProvider(mockOnSettle, window.location)
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()

    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      clock,
      deliveryFactory: () => delivery,
      schema: createSchema(window.location.hostname, new DefaultRoutingProvider()),
      plugins: (spanFactory) => [new RouteChangePlugin(spanFactory, window.location, document)]
    })

    testClient.start({ apiKey: VALID_API_KEY })

    history.pushState({}, '', url)

    await jest.runOnlyPendingTimersAsync()

    // No delivery
    expect(delivery.requests).toHaveLength(0)
  })

  it('does not create route change spans with autoInstrumentFullPageLoads set to false', async () => {
    const DefaultRoutingProvider = createDefaultRoutingProvider(mockOnSettle, window.location)
    const clock = new IncrementingClock()
    const delivery = new InMemoryDelivery()
    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      clock,
      deliveryFactory: () => delivery,
      schema: createSchema(window.location.hostname, new DefaultRoutingProvider()),
      plugins: (spanFactory) => [new RouteChangePlugin(spanFactory, window.location, document)]
    })

    testClient.start({ apiKey: VALID_API_KEY, autoInstrumentRouteChanges: false })

    history.pushState('', '', new URL('https://bugsnag.com/second-route'))

    await jest.runOnlyPendingTimersAsync()

    expect(delivery).not.toHaveSentSpan(expect.objectContaining({
      name: '[RouteChange]/second-route'
    }))
  })

  describe('validation', () => {
    const invalidRoutes: any[] = [
      // eslint-disable-next-line compat/compat
      { type: 'bigint', url: BigInt(9007199254740991) },
      { type: 'true', url: true },
      { type: 'false', url: false },
      { type: 'function', url: () => {} },
      { type: 'object', url: { property: 'test' } },
      { type: 'empty array', url: [] },
      { type: 'array', url: [1, 2, 3] },
      { type: 'symbol', url: Symbol('test') },
      { type: 'null', url: null }
    ]

    it.each(invalidRoutes)('handles invalid urls ($type)', async ({ url }) => {
      const DefaultRoutingProvider = createDefaultRoutingProvider(mockOnSettle, window.location)
      const routingProvider = new DefaultRoutingProvider()
      let routeChangeCallback: StartRouteChangeCallback = jest.fn()
      routingProvider.listenForRouteChanges = (startRouteChangeSpan) => {
        routeChangeCallback = startRouteChangeSpan
      }

      const delivery = new InMemoryDelivery()
      const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
        deliveryFactory: () => delivery,
        schema: createSchema(window.location.hostname, routingProvider),
        plugins: (spanFactory) => [new RouteChangePlugin(spanFactory, window.location, document)]
      })

      testClient.start({ apiKey: VALID_API_KEY, logger: jestLogger })
      await jest.runOnlyPendingTimersAsync()

      // trigger the route change
      const span = routeChangeCallback(url, 'trigger')
      expect(jestLogger.warn).toHaveBeenCalledWith('Invalid span options\n  - url should be a URL')

      span.end()

      await jest.runOnlyPendingTimersAsync()

      expect(delivery).not.toHaveSentSpan(expect.objectContaining({
        name: `[RouteChange]${String(url)}`
      }))
    })

    const invalidTriggers: any[] = [
      // eslint-disable-next-line compat/compat
      { type: 'bigint', trigger: BigInt(9007199254740991) },
      { type: 'true', trigger: true },
      { type: 'false', trigger: false },
      { type: 'function', trigger: () => {} },
      { type: 'object', trigger: { property: 'test' } },
      { type: 'empty array', trigger: [] },
      { type: 'array', trigger: [1, 2, 3] },
      { type: 'symbol', trigger: Symbol('test') },
      { type: 'null', trigger: null }
    ]

    it.each(invalidTriggers)('handles invalid triggers ($type)', async ({ trigger }) => {
      const DefaultRoutingProvider = createDefaultRoutingProvider(mockOnSettle, window.location)
      const routingProvider = new DefaultRoutingProvider()
      let routeChangeCallback: StartRouteChangeCallback = jest.fn()
      routingProvider.listenForRouteChanges = (startRouteChangeSpan) => {
        routeChangeCallback = startRouteChangeSpan
      }

      const delivery = new InMemoryDelivery()
      const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
        deliveryFactory: () => delivery,
        schema: createSchema(window.location.hostname, routingProvider),
        plugins: (spanFactory) => [new RouteChangePlugin(spanFactory, window.location, document)]
      })

      testClient.start({ apiKey: VALID_API_KEY, logger: jestLogger })
      await jest.runOnlyPendingTimersAsync()

      // trigger the route change
      const span = routeChangeCallback(new URL('https://bugsnag.com/route'), trigger, {})
      expect(jestLogger.warn).toHaveBeenCalledWith(`Invalid span options\n  - trigger should be a string, got ${typeof trigger}`)

      span.end()

      await jest.runOnlyPendingTimersAsync()

      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: '[RouteChange]/route'
      }))

      const routeChangeSpan = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]
      expect(routeChangeSpan).toHaveAttribute('bugsnag.browser.page.route_change.trigger', String(trigger))
    })
  })

  it('excludes attributes specified in sendPageAttributes', async () => {
    const DefaultRoutingProvider = createDefaultRoutingProvider(mockOnSettle, window.location)
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()

    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      clock,
      deliveryFactory: () => delivery,
      schema: createSchema(window.location.hostname, new DefaultRoutingProvider()),
      plugins: (spanFactory) => [new RouteChangePlugin(spanFactory, window.location, document)]
    })

    testClient.start({ apiKey: VALID_API_KEY, sendPageAttributes: { url: false, title: false } })

    history.pushState({}, '', 'https://bugsnag.com/second-route')

    await jest.runOnlyPendingTimersAsync()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[RouteChange]/second-route',
      startTimeUnixNano: '1000000',
      endTimeUnixNano: '32000000'
    }))

    const span = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]
    expect(span).toHaveAttribute('bugsnag.span.category', 'route_change')
    expect(span).toHaveAttribute('bugsnag.browser.page.route', '/second-route')
    expect(span).toHaveAttribute('bugsnag.browser.page.previous_route', '/route-change-plugin')
    expect(span).toHaveAttribute('bugsnag.browser.page.route_change.trigger', 'pushState')

    // excluded by sendPageAttributes
    expect(span).not.toHaveAttribute('bugsnag.browser.page.url')
    expect(span).not.toHaveAttribute('bugsnag.browser.page.title')
  })
})
