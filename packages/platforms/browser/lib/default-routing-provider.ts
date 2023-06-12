import { type OnSettle } from './on-settle'
import getAbsoluteUrl from './request-tracker/url-helpers'
import { type RouteResolver, type RoutingProvider, type StartRouteChangeCallback } from './routing-provider'

const defaultRouteResolver: RouteResolver = (url: URL) => url.pathname

export const createDefaultRoutingProvider = (onSettle: OnSettle, location: Location) => {
  return class DefaultRoutingProvider implements RoutingProvider {
    resolveRoute: RouteResolver

    constructor (resolveRoute = defaultRouteResolver) {
      this.resolveRoute = resolveRoute
    }

    listenForRouteChanges (startRouteChangeSpan: StartRouteChangeCallback) {
      addEventListener('popstate', () => {
        const url = new URL(location.href)
        const route = this.resolveRoute(url)
        const span = startRouteChangeSpan(route, { trigger: 'popstate' })

        onSettle((endTime) => {
          span.end(endTime)
        })
      })

      const resolveRoute = this.resolveRoute
      const originalPushState = history.pushState
      history.pushState = function (...args) {
        const url = args[2]

        if (url) {
          const absoluteURL = new URL(getAbsoluteUrl(url.toString(), document.baseURI))
          const route = resolveRoute(absoluteURL)
          const span = startRouteChangeSpan(route, { trigger: 'pushState' })

          onSettle((endTime) => {
            span.end(endTime)
          })
        }

        originalPushState.apply(this, args)
      }
    }
  }
}
