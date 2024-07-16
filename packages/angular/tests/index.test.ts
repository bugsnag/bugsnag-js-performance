/**
 * @jest-environment jsdom
 */

import { NavigationEnd, NavigationStart } from '@angular/router'
import type { Router } from '@angular/router'
import { bugsnagBootstrapper, AngularRoutingProvider } from '../lib'
import { MockSpanFactory } from '@bugsnag/js-performance-test-utilities'

jest.useFakeTimers()

describe('angular integration', () => {
  const spanFactory = new MockSpanFactory()

  describe('listenForRouteChanges', () => {
    it('attaches a handler to router events and calls startRouteChangeSpan when fired', () => {
      const router = {
        events: {
          subscribe: jest.fn()
        }
      } as unknown as Router

      const routingProvider = new AngularRoutingProvider()
      bugsnagBootstrapper.useFactory(router)

      const span = spanFactory.startSpan(
        '[FullPageLoad]/some-route',
        { }
      )

      const startRouteChangeSpan = jest.fn(() => ({
        ...spanFactory.toPublicApi(span),
        end: jest.fn()
      }))

      routingProvider.listenForRouteChanges(startRouteChangeSpan)

      jest.advanceTimersByTime(51)

      expect(router.events.subscribe).toHaveBeenCalled()

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const handler = jest.mocked(router.events.subscribe).mock.calls[0][0]!

      const navStart = new NavigationStart(0, 'url')
      // eslint-disable-next-line no-useless-call
      handler.call(undefined, navStart)

      expect(startRouteChangeSpan).toHaveBeenCalledWith(new URL('http://localhost/url'), 'imperative')

      const navEnd = new NavigationEnd(0, 'url', 'urlAfterRedirects')
      // eslint-disable-next-line no-useless-call
      handler.call(undefined, navEnd)

      jest.runAllTimers()

      const routeChangeSpan = startRouteChangeSpan.mock.results[0].value
      expect(routeChangeSpan.end).toHaveBeenCalledWith(expect.objectContaining({ url: new URL('http://localhost/url') }))
    })
  })

  describe('resolveRoute', () => {
    it('resolves the current router state to a route', () => {
      const router = {
        routerState: {
          snapshot: {
            root: {
              firstChild: {
                routeConfig: {
                  path: 'customers'
                },
                firstChild: {
                  routeConfig: {
                    path: ':customerId'
                  }
                }
              }
            }
          }
        }
      } as unknown as Router

      const routingProvider = new AngularRoutingProvider()
      bugsnagBootstrapper.useFactory(router)

      expect(routingProvider.resolveRoute(new URL('/anything', window.origin))).toBe('/customers/:customerId')
    })

    it('uses the pathname of the supplied URL if there is no router state', () => {
      const router = {
        routerState: {
          snapshot: {
            root: {}
          }
        }
      } as unknown as Router

      const routingProvider = new AngularRoutingProvider()
      bugsnagBootstrapper.useFactory(router)

      expect(routingProvider.resolveRoute(new URL(window.origin))).toBe('/')
    })

    it('inserts a placeholder for segments using custom matchers', () => {
      const router = {
        routerState: {
          snapshot: {
            root: {
              firstChild: {
                routeConfig: {
                  path: 'customers'
                },
                firstChild: {
                  routeConfig: {
                    matcher: () => {}
                  },
                  firstChild: {
                    routeConfig: {
                      path: ':customerId'
                    }
                  }
                }
              }
            }
          }
        }
      } as unknown as Router

      const routingProvider = new AngularRoutingProvider()
      bugsnagBootstrapper.useFactory(router)

      expect(routingProvider.resolveRoute(new URL(window.origin))).toBe('/customers/<custom URL matcher>/:customerId')
    })
  })
})
