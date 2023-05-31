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

describe('RouteChangePlugin', () => {
  it('automatically creates a route change span when using pushState', () => {
    const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(32) }
    const DefaultRoutingProvider = createDefaultRoutingProvider(onSettle)

    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()

    const testClient = createTestClient({
      clock,
      deliveryFactory: () => delivery,
      schema: createSchema(window.location.hostname, new DefaultRoutingProvider()),
      plugins: (spanFactory) => [new RouteChangePlugin(spanFactory, onSettle, clock)]
    })

    testClient.start({ apiKey: VALID_API_KEY })

    // Perform route changes
    history.pushState('', '', new URL('https://bugsnag.com/second-route'))

    jest.runAllTimers()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[RouteChange]/second-route',
      startTimeUnixNano: '1000000',
      endTimeUnixNano: '32000000'
    }))

    const pushStateSpan = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]
    expect(pushStateSpan).toHaveAttribute('bugsnag.span.category', 'route_change')
    expect(pushStateSpan).toHaveAttribute('bugsnag.browser.page.route', '/second-route')
    expect(pushStateSpan).toHaveAttribute('bugsnag.browser.page.previous_route', '/route-change-plugin')
  })
})
