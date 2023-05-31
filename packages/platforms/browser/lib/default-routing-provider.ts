import { type StartRouteChangeSpan } from './auto-instrumentation'
import { type OnSettle } from './on-settle'
import getAbsoluteUrl from './request-tracker/url-helpers'
import { type RouteResolver, type RoutingProvider } from './routing-provider'

const defaultRouteResolver: RouteResolver = (url: URL) => url.pathname

const sanitizeURL = (url: URL | string) => {
  if (url instanceof URL) {
    return url
  }

  return new URL(getAbsoluteUrl(url, window.document.baseURI))
}

export const createDefaultRoutingProvider = (onSettle: OnSettle) => {
  return class DefaultRoutingProvider implements RoutingProvider {
    resolveRoute: RouteResolver

    constructor (resolveRoute = defaultRouteResolver) {
      this.resolveRoute = resolveRoute
    }

    getInitialRoute () {
      return this.resolveRoute(sanitizeURL(window.location.pathname))
    }

    configure (startRouteChangeSpan: StartRouteChangeSpan) {
      addEventListener('popstate', () => {
        const route = this.resolveRoute(sanitizeURL(window.location.pathname))
        const span = startRouteChangeSpan(route)

        onSettle((endTime) => {
          span.end(endTime)
        })
      })

      const resolveRoute = this.resolveRoute

      const originalPushState = history.pushState
      history.pushState = function (...args) {
        const url = args[2]

        if (url) {
          const route = resolveRoute(sanitizeURL(url))
          const span = startRouteChangeSpan(route)

          onSettle((endTime) => {
            span.end(endTime)
          })
        }

        originalPushState.apply(this, args)
      }
    }
  }
}
