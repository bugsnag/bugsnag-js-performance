import { isObject } from '@bugsnag/core-performance'
import { type StartRouteChangeSpan } from './auto-instrumentation'
import { type OnSettle } from './on-settle'
import getAbsoluteUrl from './request-tracker/url-helpers'

export interface RoutingProvider {
  resolveRoute: RouteResolver
  configure: (startRouteChangeSpan: StartRouteChangeSpan, onSettle: OnSettle) => void
}

export type RouteResolver = (url: URL) => string

const defaultRouteResolver: RouteResolver = (url: URL) => url.pathname

const sanitizeURL = (url: URL | string) => {
  if (url instanceof URL) {
    return url
  }

  return new URL(getAbsoluteUrl(url, window.document.baseURI))
}

export class DefaultRoutingProvider implements RoutingProvider {
  resolveRoute: RouteResolver

  constructor (resolveRoute = defaultRouteResolver) {
    this.resolveRoute = resolveRoute
  }

  configure (startRouteChangeSpan: StartRouteChangeSpan, onSettle: OnSettle) {
    let initialRoute: string | undefined = this.resolveRoute(sanitizeURL(window.location.pathname))

    addEventListener('popstate', () => {
      const route = this.resolveRoute(sanitizeURL(window.location.pathname))
      const span = startRouteChangeSpan(route, { previousRoute: initialRoute })

      // clear initial route
      initialRoute = undefined

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
        const span = startRouteChangeSpan(route, { previousRoute: initialRoute })

        // clear initial route
        initialRoute = undefined

        onSettle((endTime) => {
          span.end(endTime)
        })
      }

      originalPushState.apply(this, args)
    }
  }
}

export const isRoutingProvider = (value: unknown): value is RoutingProvider =>
  isObject(value) &&
    typeof value.resolveRoute === 'function' &&
    typeof value.configure === 'function'
