/**
 * @jest-environment jsdom
 */

import { SvelteKitRoutingProvider } from '../lib/svelte-kit-routing-provider'

jest.useFakeTimers()

describe('SvelteKitRoutingProvider', () => {
  describe('listenForRouteChanges', () => {
    it('invokes the provided callback on route change', () => {
      const beforeNavigate = jest.fn()
      const afterNavigate = jest.fn()
      const routingProvider = new SvelteKitRoutingProvider(beforeNavigate, afterNavigate)

      const startRouteChangeSpan = jest.fn()
      routingProvider.listenForRouteChanges(startRouteChangeSpan)

      // Simulate a SvelteKit navigation event
      beforeNavigate.mock.calls[0][0]({
        type: 'link',
        to: {
          url: 'https://bugsnag.com/contacts/1234',
          route: { id: '/contacts/[id]' }
        }
      })

      expect(startRouteChangeSpan.mock.calls[0]).toStrictEqual(['https://bugsnag.com/contacts/1234', 'link', { startTime: 0 }])
    })
  })

  describe('resolveRoute', () => {
    // Expected behavior for this plugin ignored the expected behaviour
    // and returns the current route
    it('always returns the current route', () => {
      const beforeNavigate = jest.fn()
      const afterNavigate = jest.fn()
      const routingProvider = new SvelteKitRoutingProvider(beforeNavigate, afterNavigate)

      const startRouteChangeSpan = jest.fn()
      routingProvider.listenForRouteChanges(startRouteChangeSpan)

      // Set the current route
      afterNavigate.mock.calls[0][0]({ to: { route: { id: '/initial-route' } } })

      const url = new URL('/contacts/[contactId]', 'https://bugsnag.com')
      expect(routingProvider.resolveRoute(url)).toBe('/initial-route')
    })
  })
})
