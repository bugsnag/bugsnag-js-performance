import { isObject } from '@bugsnag/core-performance'
import { type OnSettle } from './on-settle'
import { type StartRouteChangeSpan } from './auto-instrumentation'

export interface RoutingProvider {
  resolveRoute: RouteResolver
  configure: (startRouteChangeSpan: StartRouteChangeSpan, onSettle: OnSettle) => void
}

export type RouteResolver = (url: URL | string) => string

const defaultRouteResolver: RouteResolver = (url: URL | string) => {
  if (url instanceof URL) {
    return url.pathname
  } else if (url.startsWith('/')) {
    return url
  } else if (url.startsWith('http')) {
    return new URL(url).pathname
  }

  return url
}

export class DefaultRoutingProvider implements RoutingProvider {
  resolveRoute: RouteResolver

  constructor (resolveRoute = defaultRouteResolver) {
    this.resolveRoute = resolveRoute
  }

  configure (startRouteChangeSpan: StartRouteChangeSpan, onSettle: OnSettle) {
    let initialRoute: string | undefined = this.resolveRoute(window.location.pathname)

    addEventListener('popstate', () => {
      const route = this.resolveRoute(window.location.pathname)
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
        const route = resolveRoute(url)
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
