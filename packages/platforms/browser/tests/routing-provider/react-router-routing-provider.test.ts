/**
 * @jest-environment jsdom
 */

import { createReactRouterRoutingProvider } from '../../lib/routing-provider/react-router-routing-provider'

jest.useFakeTimers()

describe('ReactRouterRoutingProvider', () => {
  const routes = [
    {
      path: '/',
      element: '<Root />',
      children: [
        {
          path: 'contacts/:contactId',
          element: '<Contact />',
          children: [
            {
              path: 'edit',
              element: '<EditContact />'
            }
          ]
        }
      ]
    }
  ]

  describe('listenForRouteChanges', () => {
    it('invokes the provided callback on pushState', () => {
      const onSettle = jest.fn(() => 1234)
      const ReactRouterRoutingProvider = createReactRouterRoutingProvider(onSettle, window.location)

      const routingProvider = new ReactRouterRoutingProvider(routes)
      const startRouteChangeSpan = jest.fn()

      routingProvider.listenForRouteChanges(startRouteChangeSpan)

      history.pushState({}, '', '/contacts/1')

      expect(startRouteChangeSpan).toHaveBeenCalled()
    })

    it('invokes the provided callback on popstate', () => {
      const onSettle = jest.fn(() => 1234)
      const ReactRouterRoutingProvider = createReactRouterRoutingProvider(onSettle, window.location)

      const routingProvider = new ReactRouterRoutingProvider(routes)
      const startRouteChangeSpan = jest.fn()

      history.pushState({}, '', '/contacts/2')

      routingProvider.listenForRouteChanges(startRouteChangeSpan)

      history.back()

      jest.runAllTimers()

      expect(startRouteChangeSpan).toHaveBeenCalled()
    })
  })

  describe('resolveRoute', () => {
    it('uses the provided routes when resolving routes', () => {
      const onSettle = jest.fn(() => 1234)
      const ReactRouterRoutingProvider = createReactRouterRoutingProvider(onSettle, window.location)

      const routingProvider = new ReactRouterRoutingProvider(routes)

      expect(routingProvider.resolveRoute(new URL(window.location.href))).toBe('/contacts/:contactId')

      history.pushState({}, '', '/contacts/2/edit')

      expect(routingProvider.resolveRoute(new URL(window.location.href))).toBe('/contacts/:contactId/edit')
    })
  })

  describe('basename', () => {
    it('uses the provided basename when resolving routes', () => {
      const onSettle = jest.fn(() => 1234)
      const ReactRouterRoutingProvider = createReactRouterRoutingProvider(onSettle, window.location)

      const routingProvider = new ReactRouterRoutingProvider(routes, '/app')

      history.pushState({}, '', '/app/contacts/2/edit')

      expect(routingProvider.resolveRoute(new URL(window.location.href))).toBe('/contacts/:contactId/edit')
    })
  })
})
