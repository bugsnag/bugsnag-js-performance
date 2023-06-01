import { type OnSettle } from './on-settle'
import getAbsoluteUrl from './request-tracker/url-helpers'
import { type OnRouteChangeCallback, type OnSettleCallback, type RouteResolver, type RoutingProvider } from './routing-provider'

const defaultRouteResolver: RouteResolver = (url: URL) => url.pathname

const sanitizeURL = (url: URL | string) => {
  if (url instanceof URL) {
    return url
  }

  return new URL(getAbsoluteUrl(url, window.document.baseURI))
}

export const createDefaultRoutingProvider = (defaultOnSettle: OnSettle) => {
  return class DefaultRoutingProvider implements RoutingProvider {
    location: Location

    resolveRoute: RouteResolver

    constructor (location: Location, resolveRoute = defaultRouteResolver) {
      this.resolveRoute = resolveRoute
      this.location = location
    }

    get initialRoute () {
      return this.resolveRoute(sanitizeURL(this.location.pathname))
    }

    onRouteChange (callback: OnRouteChangeCallback) {
      addEventListener('popstate', () => {
        const url = sanitizeURL(this.location.pathname)
        const route = this.resolveRoute(url)
        callback(route)
      })

      const resolveRoute = this.resolveRoute
      const originalPushState = history.pushState
      history.pushState = function (...args) {
        const url = args[2]

        if (url) {
          const route = resolveRoute(sanitizeURL(url))
          callback(route)
        }

        originalPushState.apply(this, args)
      }
    }

    onSettle (callback: OnSettleCallback) {
      defaultOnSettle(callback)
    }
  }
}
