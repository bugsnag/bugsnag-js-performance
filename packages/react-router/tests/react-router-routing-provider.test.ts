/**
 * @jest-environment jsdom
 */

import { type RouteChangeSpan } from '@bugsnag/browser-performance'
import { ReactRouterRoutingProvider } from '../lib/react-router-routing-provider'
import { MockSpanFactory } from '@bugsnag/js-performance-test-utilities'

jest.useFakeTimers()

describe('ReactRouterRoutingProvider', () => {
  const spanFactory = new MockSpanFactory()

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
      const routingProvider = new ReactRouterRoutingProvider(routes)
      const span = spanFactory.startSpan(
        '[FullPageLoad]/some-route',
        { }
      )
      const startRouteChangeSpan = jest.fn(() => spanFactory.toPublicApi(span) as RouteChangeSpan)

      routingProvider.listenForRouteChanges(startRouteChangeSpan)

      history.pushState({}, '', '/contacts/1')

      expect(startRouteChangeSpan).toHaveBeenCalled()
    })

    it('invokes the provided callback on popstate', () => {
      const routingProvider = new ReactRouterRoutingProvider(routes)
      const span = spanFactory.startSpan(
        '[FullPageLoad]/some-route',
        { }
      )
      const startRouteChangeSpan = jest.fn(() => spanFactory.toPublicApi(span) as RouteChangeSpan)

      history.pushState({}, '', '/contacts/2')

      routingProvider.listenForRouteChanges(startRouteChangeSpan)

      history.back()

      jest.runAllTimers()

      expect(startRouteChangeSpan).toHaveBeenCalled()
    })
  })

  describe('resolveRoute', () => {
    it('uses the provided routes when resolving routes', () => {
      const routingProvider = new ReactRouterRoutingProvider(routes)

      expect(routingProvider.resolveRoute(new URL(window.location.href))).toBe('/contacts/:contactId')

      history.pushState({}, '', '/contacts/2/edit')

      expect(routingProvider.resolveRoute(new URL(window.location.href))).toBe('/contacts/:contactId/edit')
    })
  })

  describe('basename', () => {
    it('uses the provided basename when resolving routes', () => {
      const routingProvider = new ReactRouterRoutingProvider(routes, '/app')

      history.pushState({}, '', '/app/contacts/2/edit')

      expect(routingProvider.resolveRoute(new URL(window.location.href))).toBe('/contacts/:contactId/edit')
    })

    it('allows "/" as a basename', () => {
      const routingProvider = new ReactRouterRoutingProvider(routes, '/')

      expect(routingProvider.resolveRoute(new URL('/contacts/2/edit', window.origin))).toBe('/contacts/:contactId/edit')
    })
  })
})
