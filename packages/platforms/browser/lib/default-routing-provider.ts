import { type OnSettle } from './on-settle'
import getAbsoluteUrl from './request-tracker/url-helpers'
import { type StartRouteChangeCallback, type RouteResolver, type RoutingProvider } from './routing-provider'

const defaultRouteResolver: RouteResolver = (url: URL) => url.pathname

const sanitizeURL = (url: URL | string) => {
  if (url instanceof URL) {
    return url
  }

  return new URL(getAbsoluteUrl(url, window.document.baseURI))
}

export const createDefaultRoutingProvider = (onSettle: OnSettle, location: Location) => {
  return class DefaultRoutingProvider implements RoutingProvider {
    resolveRoute: RouteResolver

    constructor (location: Location, resolveRoute = defaultRouteResolver) {
      this.resolveRoute = resolveRoute
    }

    listenForRouteChanges (startRouteChangeSpan: StartRouteChangeCallback) {
      addEventListener('popstate', () => {
        const url = sanitizeURL(location.pathname)
        const route = this.resolveRoute(url)
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
