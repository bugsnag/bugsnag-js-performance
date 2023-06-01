/**
 * @jest-environment jsdom
 */

import { createDefaultRoutingProvider } from '../lib/default-routing-provider'
import { isRoutingProvider } from '../lib/routing-provider'

const DefaultRoutingProvider = createDefaultRoutingProvider(jest.fn())

describe('DefaultRoutingProvider', () => {
  it('Uses a provided route resolver function', () => {
    const routeResolverFn = jest.fn((url: URL | string) => 'resolved-route')
    const routingProvier = new DefaultRoutingProvider(window.location, routeResolverFn)
    const resolvedRoute = routingProvier.resolveRoute(new URL('https://www.bugsnag.com'))

    expect(resolvedRoute).toBe('resolved-route')
    expect(routeResolverFn).toHaveBeenCalled()
  })

  describe('defaultRouteResolver', () => {
    it('Returns a route when provided a complete URL', () => {
      const url = new URL('https://www.bugsnag.com/platforms/javascript?test=true#unit-test')
      const routingProvier = new DefaultRoutingProvider(window.location)
      const resolvedRoute = routingProvier.resolveRoute(url)

      expect(resolvedRoute).toBe('/platforms/javascript')
    })
  })
})

describe('isRoutingProvider', () => {
  it('Returns true for a valid routing provider', () => {
    const routingProvider = new DefaultRoutingProvider(window.location)
    expect(isRoutingProvider(routingProvider)).toBe(true)
  })

  it('Returns false for an invalid routing provider', () => {
    const notRoutingProvider = { method: () => 'test' }
    expect(isRoutingProvider(notRoutingProvider)).toBe(false)
  })
})
