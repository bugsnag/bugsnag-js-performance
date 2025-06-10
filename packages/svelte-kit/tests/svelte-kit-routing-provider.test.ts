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
          route: { id: '/contacts/[contactId]' }
        }
      })

      expect(startRouteChangeSpan.mock.calls[0]).toStrictEqual(['https://bugsnag.com/contacts/1234', 'link', { startTime: 0 }])
    })
  })

  describe('resolveRoute', () => {
    // Expected behavior for this plugin ignores the standard URL to string conversion
    // and returns the current route
    it('returns the current route', () => {
      const beforeNavigate = jest.fn()
      const afterNavigate = jest.fn()
      const routingProvider = new SvelteKitRoutingProvider(beforeNavigate, afterNavigate, '/initial-route')

      const startRouteChangeSpan = jest.fn()
      routingProvider.listenForRouteChanges(startRouteChangeSpan)

      const url = new URL('/contacts/[contactId]', 'https://bugsnag.com')
      expect(routingProvider.resolveRoute(url)).toBe('/initial-route')
    })
  })
})
