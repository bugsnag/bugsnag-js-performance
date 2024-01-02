/**
 * @jest-environment jsdom
 */

import { createDefaultRoutingProvider, createNoopRoutingProvider, defaultRouteResolver } from '../lib/default-routing-provider'

jest.useFakeTimers()

describe('defaultRouteResolver', () => {
  const array = [
    {
      type: 'empty string',
      path: '',
      expected: '/'
    },
    {
      type: 'simple path',
      path: '/new-route',
      expected: '/new-route'
    },
    {
      type: 'path with query string',
      path: '/new-route?apiKey=1234',
      expected: '/new-route'
    }
  ]

  it.each(array)('correctly resolves a given route ($type)', ({ path, expected }) => {
    const url = new URL(path, document.baseURI)
    const route = defaultRouteResolver(url)
    expect(route).toBe(expected)
  })
})

describe('DefaultRoutingProvider', () => {
  describe('listenForRouteChanges', () => {
    it('invokes the provided callback on pushState', () => {
      const onSettle = jest.fn(() => 1234)
      const DefaultRoutingProvider = createDefaultRoutingProvider(onSettle, window.location)

      const routingProvider = new DefaultRoutingProvider()
      const startRouteChangeSpan = jest.fn()

      routingProvider.listenForRouteChanges(startRouteChangeSpan)

      history.pushState({}, '', '/first-route')

      expect(startRouteChangeSpan).toHaveBeenCalled()
    })

    it('invokes the provided callback on popstate', () => {
      const onSettle = jest.fn(() => 1234)
      const DefaultRoutingProvider = createDefaultRoutingProvider(onSettle, window.location)

      const routingProvider = new DefaultRoutingProvider()
      const startRouteChangeSpan = jest.fn()

      history.pushState({}, '', '/second-route')

      routingProvider.listenForRouteChanges(startRouteChangeSpan)

      history.back()

      jest.runAllTimers()

      expect(startRouteChangeSpan).toHaveBeenCalled()
    })
  })

  describe('resolveRoute', () => {
    it('uses the provided routeResolver function', () => {
      const onSettle = jest.fn(() => 1234)
      const DefaultRoutingProvider = createDefaultRoutingProvider(onSettle, window.location)
      const routeResolver = jest.fn(() => 'new route')

      const routingProvider = new DefaultRoutingProvider(routeResolver)

      const url = new URL(window.location.href)
      const route = routingProvider.resolveRoute(url)

      expect(route).toBe('new route')
      expect(routeResolver).toHaveBeenCalled()
    })
  })
})

describe('noopRoutingProvider', () => {
  it('implements the expected API', () => {
    expect(() => {
      const NoopRoutingProvider = createNoopRoutingProvider()
      const routeResolver = jest.fn(() => 'new route')
      const routingProvider = new NoopRoutingProvider(routeResolver)

      routingProvider.listenForRouteChanges(jest.fn())
      expect(routingProvider.resolveRoute(new URL(window.location.href))).toBe('new route')
      expect(routeResolver).toHaveBeenCalled()
    }).not.toThrow()
  })
})
