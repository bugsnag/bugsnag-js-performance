import { isObject } from '@bugsnag/core-performance'
import { type OnSettle } from './on-settle'
import { type StartRouteChangeSpan } from './auto-instrumentation'
import getAbsoluteUrl from './request-tracker/url-helpers'

export interface RoutingProvider {
  resolveRoute: RouteResolver
  configure: (startRouteChangeSpan: StartRouteChangeSpan, onSettle: OnSettle) => void
}

export type RouteResolver = (url: URL | string) => string

const defaultRouteResolver: RouteResolver = (url: URL | string) => url instanceof URL ? url.pathname : url

export class DefaultRoutingProvider implements RoutingProvider {
  resolveRoute: RouteResolver

  constructor (resolveRoute = defaultRouteResolver) {
    this.resolveRoute = resolveRoute
  }

  configure (startRouteChangeSpan: StartRouteChangeSpan, onSettle: OnSettle) {
    let initialRoute: string | undefined = this.resolveRoute(new URL(window.location.href))

    addEventListener('popstate', () => {
      const route = this.resolveRoute(window.location.href)
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
        const absoluteUrl = getAbsoluteUrl(url.toString(), window.location.hostname)
        const route = resolveRoute(new URL(absoluteUrl))
        console.log({ absoluteUrl, route })
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
    typeof value.configure === 'function'
