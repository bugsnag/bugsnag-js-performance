/**
 * @jest-environment jsdom
 * @jest-environment-options { "url": "https://bugsnag.com/route-change-plugin" }
 */

import { InMemoryDelivery, IncrementingClock, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { RouteChangePlugin } from '../lib/auto-instrumentation/route-change-plugin'
import { createSchema } from '../lib/config'
import { createDefaultRoutingProvider } from '../lib/default-routing-provider'
import { type OnSettle } from '../lib/on-settle'

jest.useFakeTimers()

afterEach(() => {
  history.replaceState({}, 'unused', 'https://bugsnag.com/route-change-plugin')
  jest.clearAllTimers()
})

describe('RouteChangePlugin', () => {
  it.each([
    { type: 'URL', url: new URL('https://bugsnag.com/second-route') },
    { type: 'string (absolute URL)', url: 'https://bugsnag.com/second-route' },
    { type: 'string (relative URL)', url: '/second-route' }
  ])('creates a route change span on pushState with $type', ({ url }) => {
    const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(32) }
    const DefaultRoutingProvider = createDefaultRoutingProvider(onSettle, window.location)
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()

    const testClient = createTestClient({
      clock,
      deliveryFactory: () => delivery,
      schema: createSchema(window.location.hostname, new DefaultRoutingProvider()),
      plugins: (spanFactory) => [new RouteChangePlugin(spanFactory, clock, window.location)]
    })

    testClient.start({ apiKey: VALID_API_KEY })

    history.pushState({}, '', url)

    jest.runOnlyPendingTimers()

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
  })

  it('creates a route change span on popstate', () => {
    const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(32) }
    const DefaultRoutingProvider = createDefaultRoutingProvider(onSettle, window.location)
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()

    const testClient = createTestClient({
      clock,
      deliveryFactory: () => delivery,
      schema: createSchema(window.location.hostname, new DefaultRoutingProvider()),
      plugins: (spanFactory) => [new RouteChangePlugin(spanFactory, clock, window.location)]
    })

    history.pushState({}, '', '/first-route')
    history.pushState({}, '', '/second-route')
    testClient.start({ apiKey: VALID_API_KEY })

    history.back()
    jest.runAllTimers()

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
    expect(firstRouteSpan).toHaveAttribute('bugsnag.browser.page.previous_route', '/second-route')
    expect(firstRouteSpan).toHaveAttribute('bugsnag.browser.page.route_change.trigger', 'popstate')

    history.forward()
    jest.runAllTimers()

    expect(delivery).toHaveSentSpan(secondSpan)

    const secondRouteSpan = delivery.requests[1].resourceSpans[0].scopeSpans[0].spans[0]
    expect(secondRouteSpan).toHaveAttribute('bugsnag.span.category', 'route_change')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.browser.page.route', '/second-route')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.browser.page.previous_route', '/first-route')
    expect(firstRouteSpan).toHaveAttribute('bugsnag.browser.page.route_change.trigger', 'popstate')
  })

  it.each([
    { type: 'empty string', url: '' },
    { type: 'undefined', url: undefined },
    { type: 'null', url: null }
  ])('does not create a route change span on pushState with $type', ({ url }) => {
    const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(32) }
    const DefaultRoutingProvider = createDefaultRoutingProvider(onSettle, window.location)
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()

    const testClient = createTestClient({
      clock,
      deliveryFactory: () => delivery,
      schema: createSchema(window.location.hostname, new DefaultRoutingProvider()),
      plugins: (spanFactory) => [new RouteChangePlugin(spanFactory, clock, window.location)]
    })

    testClient.start({ apiKey: VALID_API_KEY })

    history.pushState({}, '', url)

    jest.runOnlyPendingTimers()

    // No delivery
    expect(delivery.requests).toHaveLength(0)
  })

  it('does not create route change spans with autoInstrumentFullPageLoads set to false', () => {
    const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(32) }
    const DefaultRoutingProvider = createDefaultRoutingProvider(onSettle, window.location)
    const clock = new IncrementingClock()
    const delivery = new InMemoryDelivery()
    const testClient = createTestClient({
      clock,
      deliveryFactory: () => delivery,
      schema: createSchema(window.location.hostname, new DefaultRoutingProvider()),
      plugins: (spanFactory) => [new RouteChangePlugin(spanFactory, clock, window.location)]
    })

    testClient.start({ apiKey: VALID_API_KEY, autoInstrumentRouteChanges: false })

    history.pushState('', '', new URL('https://bugsnag.com/second-route'))

    jest.runAllTimers()

    expect(delivery).not.toHaveSentSpan(expect.objectContaining({
      name: '[RouteChange]/second-route'
    }))
  })
})
