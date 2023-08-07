/**
 * @jest-environment jsdom
 * @jest-environment-options { "url": "https://bugsnag.com/route-change-plugin" }
 */

import { InMemoryDelivery, IncrementingClock, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { RouteChangePlugin } from '../lib/auto-instrumentation/route-change-plugin'
import { type BrowserConfiguration, type BrowserSchema, createSchema } from '../lib/config'
import { createDefaultRoutingProvider } from '../lib/routing-provider/default-routing-provider'
import { isRoutingProvider } from '../lib/routing-provider'

jest.useFakeTimers()

const DefaultRoutingProvider = createDefaultRoutingProvider(jest.fn((c) => { c(32) }), window.location)

describe('DefaultRoutingProvider', () => {
  it('Uses a provided route resolver function', async () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()
    const routeResolverFn = jest.fn((url: URL | string) => '/resolved-route')
    const routingProvier = new DefaultRoutingProvider(routeResolverFn)
    const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
      clock,
      deliveryFactory: () => delivery,
      schema: createSchema(window.location.hostname, routingProvier),
      plugins: (spanFactory) => [new RouteChangePlugin(spanFactory, window.location, document)]
    })

    testClient.start({ apiKey: VALID_API_KEY })

    history.pushState({}, '', '/new-route')

    await jest.runOnlyPendingTimersAsync()

    expect(routeResolverFn).toHaveBeenCalled()
    expect(delivery).toHaveSentSpan(expect.objectContaining({ name: '[RouteChange]/resolved-route' }))
  })

  describe('defaultRouteResolver', () => {
    it('Returns a route when provided a complete URL', async () => {
      const clock = new IncrementingClock('1970-01-01T00:00:00Z')
      const delivery = new InMemoryDelivery()
      const routingProvier = new DefaultRoutingProvider()
      const testClient = createTestClient<BrowserSchema, BrowserConfiguration>({
        clock,
        deliveryFactory: () => delivery,
        schema: createSchema(window.location.hostname, routingProvier),
        plugins: (spanFactory) => [new RouteChangePlugin(spanFactory, window.location, document)]
      })

      testClient.start({ apiKey: VALID_API_KEY })

      const url = new URL('https://bugsnag.com/platforms/javascript?test=true#unit-test')
      history.pushState({}, '', url)

      await jest.runOnlyPendingTimersAsync()

      expect(delivery).toHaveSentSpan(expect.objectContaining({ name: '[RouteChange]/platforms/javascript' }))
    })
  })
})

describe('isRoutingProvider', () => {
  it('Returns true for a valid routing provider', () => {
    const routingProvider = new DefaultRoutingProvider()
    expect(isRoutingProvider(routingProvider)).toBe(true)
  })

  it.each([
    1234,
    null,
    undefined,
    'a string',
    { method: () => 'test' },
    () => ({ initialRoute: '/route', onRouteChange: () => {}, onSettle: () => {} }),
    { initialRoute: 123, onRouteChange: () => {}, onSettle: () => {} }
  ])('Returns false for an invalid routing provider', (notRoutingProvider) => {
    expect(isRoutingProvider(notRoutingProvider)).toBe(false)
  })
})
