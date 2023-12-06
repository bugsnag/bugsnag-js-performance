/**
 * @jest-environment jsdom
 */

import { type Router } from 'vue-router'
import { VueRouterRoutingProvider } from '../lib/vue-router-routing-provider'
import { MockSpanFactory } from '@bugsnag/js-performance-test-utilities'
import { type RouteChangeSpan, type StartRouteChangeCallback } from '@bugsnag/browser-performance'

jest.useFakeTimers()

describe('VueRouterRoutingProvider', () => {
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

  const router = {
    getRoutes () {
      return routes
    },
    beforeResolve: jest.fn()
  } as unknown as Router

  describe('listenForRouteChanges', () => {
    it('attaches a handler to the beforeResolve event and calls startRouteChangeSpan when fired', () => {
      const routingProvider = new VueRouterRoutingProvider(router)
      const span = spanFactory.startSpan(
        '[FullPageLoad]/some-route',
        { }
      )
      const startRouteChangeSpan: StartRouteChangeCallback = jest.fn(() => spanFactory.toPublicApi(span) as RouteChangeSpan)

      routingProvider.listenForRouteChanges(startRouteChangeSpan)

      expect(router.beforeResolve).toHaveBeenCalled()

      const handler = jest.mocked(router.beforeResolve).mock.calls[0][0]

      const to = {
        matched: [],
        path: '/contacts/1',
        fullPath: '/contacts/1',
        query: {},
        hash: '',
        redirectedFrom: undefined,
        name: 'contact',
        params: {},
        meta: {}
      }

      const initialFrom = {
        matched: [],
        path: '/',
        fullPath: '/',
        query: {},
        hash: '',
        redirectedFrom: undefined,
        name: 'root',
        params: {},
        meta: {}
      }
      // eslint-disable-next-line no-useless-call
      handler.call(undefined, to, initialFrom, jest.fn())

      expect(startRouteChangeSpan).toHaveBeenCalled()
    })

    it('does not call startRouteChangeSpan on the initial page load', () => {
      const routingProvider = new VueRouterRoutingProvider(router)
      const span = spanFactory.startSpan(
        '[FullPageLoad]/some-route',
        { }
      )
      const startRouteChangeSpan: StartRouteChangeCallback = jest.fn(() => spanFactory.toPublicApi(span) as RouteChangeSpan)

      routingProvider.listenForRouteChanges(startRouteChangeSpan)

      expect(router.beforeResolve).toHaveBeenCalled()

      const handler = jest.mocked(router.beforeResolve).mock.calls[0][0]

      const to = {
        matched: [],
        path: '/',
        fullPath: '/',
        query: {},
        hash: '',
        redirectedFrom: undefined,
        name: 'root',
        params: {},
        meta: {}
      }

      // from.name is undefined for the initial page load
      const initialFrom = {
        matched: [],
        path: '/',
        fullPath: '/',
        query: {},
        hash: '',
        redirectedFrom: undefined,
        name: undefined,
        params: {},
        meta: {}
      }
      // eslint-disable-next-line no-useless-call
      handler.call(undefined, to, initialFrom, jest.fn())

      expect(startRouteChangeSpan).not.toHaveBeenCalled()
    })
  })

  describe('resolveRoute', () => {
    it('uses the provided routes when resolving routes', () => {
      const routingProvider = new VueRouterRoutingProvider(router)

      expect(routingProvider.resolveRoute(new URL('/contacts/2', window.origin))).toBe('/contacts/:contactId')

      expect(routingProvider.resolveRoute(new URL('/contacts/2/edit', window.origin))).toBe('/contacts/:contactId/edit')
    })
  })

  describe('basename', () => {
    it('uses the provided basename when resolving routes', () => {
      const routingProvider = new VueRouterRoutingProvider(router, '/app')

      expect(routingProvider.resolveRoute(new URL('/app/contacts/2/edit', window.origin))).toBe('/contacts/:contactId/edit')
    })

    it('allows "/" as a basename', () => {
      const routingProvider = new VueRouterRoutingProvider(router, '/')

      expect(routingProvider.resolveRoute(new URL('/contacts/2/edit', window.origin))).toBe('/contacts/:contactId/edit')
    })
  })
})
