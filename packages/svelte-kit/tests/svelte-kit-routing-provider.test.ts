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
      const routingProvider = new SvelteKitRoutingProvider(beforeNavigate, afterNavigate, 'http://bugnsag.com')

      const startRouteChangeSpan = jest.fn()
      routingProvider.listenForRouteChanges(startRouteChangeSpan)

      // Simulate a SvelteKit navigation event
      history.pushState({}, '', '/contacts/1')
      beforeNavigate.mock.calls[0][0]({ type: 'link', to: { route: { id: '/contacts/[id]' } } })

      const expectedUrl = new URL('http://bugsnag.com/contacts/[id]')
      expect(startRouteChangeSpan.mock.calls).toEqual([[expectedUrl, 'link', { startTime: 0 }]])
    })
  })

  describe('resolveRoute', () => {
    it('uses the provided routes when resolving routes', () => {
      const beforeNavigate = jest.fn()
      const afterNavigate = jest.fn()

      const routingProvider = new SvelteKitRoutingProvider(beforeNavigate, afterNavigate)

      // Routes are provided as URLs in SvelteKit, so we only need to convert them to strings
      const url = new URL('/contacts/[contactId]', 'https://bugsnag.com')
      expect(routingProvider.resolveRoute(url)).toBe('https://bugsnag.com/contacts/[contactId]')
    })
  })
})
