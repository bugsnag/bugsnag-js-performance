import type { OnSettle } from './on-settle'
import { getAbsoluteUrl } from '@bugsnag/request-tracker-performance'
import type { RouteResolver, RoutingProvider, StartRouteChangeCallback } from './routing-provider'

export const defaultRouteResolver: RouteResolver = (url: URL) => url.pathname || '/'

export const createNoopRoutingProvider = () => {
  return class NoopRoutingProvider implements RoutingProvider {
    resolveRoute: RouteResolver

    constructor (resolveRoute = defaultRouteResolver) {
      this.resolveRoute = resolveRoute
    }

    listenForRouteChanges (startRouteChangeSpan: StartRouteChangeCallback) {}
  }
}

export const createDefaultRoutingProvider = (onSettle: OnSettle, location: Location) => {
  return class DefaultRoutingProvider implements RoutingProvider {
    resolveRoute: RouteResolver

    constructor (resolveRoute = defaultRouteResolver) {
      this.resolveRoute = resolveRoute
    }

    listenForRouteChanges (startRouteChangeSpan: StartRouteChangeCallback) {
      addEventListener('popstate', (ev) => {
        const url = new URL(location.href)
        const span = startRouteChangeSpan(url, 'popstate')

        onSettle((endTime) => {
          span.end(endTime)
        })
      })

      const originalPushState = history.pushState
      history.pushState = function (...args) {
        const url = args[2]

        if (url) {
          const absoluteURL = new URL(getAbsoluteUrl(url.toString(), document.baseURI))
          const span = startRouteChangeSpan(absoluteURL, 'pushState')

          onSettle((endTime) => {
            span.end(endTime)
          })
        }

        originalPushState.apply(this, args)
      }
    }
  }
}
