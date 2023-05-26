import { isObject, type Clock } from '@bugsnag/core-performance'

type RouteChangeCallback = (currentRoute: string, previousRoute: string, startTime: number) => void

export interface RoutingProvider {
  resolveRoute: RouteResolver
  onRouteChange: (routeChangeCallback: RouteChangeCallback, clock: Clock) => void
}

export type RouteResolver = (url: URL) => string

const defaultRouteResolver: RouteResolver = (url: URL) => url.pathname

const sanitizeUrl = (url: string | URL) => {
  if (url instanceof URL) return url

  if (!url.startsWith('http')) {
    const fullUrl = window.location.origin.replace(window.location.port, '') + url
    return new URL(fullUrl)
  }

  return new URL(url)
}

export class DefaultRoutingProvider implements RoutingProvider {
  resolveRoute: RouteResolver

  constructor (resolveRoute = defaultRouteResolver) {
    this.resolveRoute = resolveRoute
  }

  onRouteChange (routeChangeSpanCallback: RouteChangeCallback, clock: Clock) {
    let previousUrl = sanitizeUrl(window.location.href)

    const startRouteChangeSpan = (url: URL) => {
      const currentRoute = this.resolveRoute(url)
      const previousRoute = this.resolveRoute(previousUrl)
      routeChangeSpanCallback(currentRoute, previousRoute, clock.now())
      previousUrl = url
    }

    const originalPushState = history.pushState
    history.pushState = function (...args) {
      const url = args[2]

      if (url) {
        const safeUrl = sanitizeUrl(url)
        startRouteChangeSpan(safeUrl)
      }

      originalPushState.apply(this, args)
    }

    addEventListener('popstate', () => {
      const safeUrl = sanitizeUrl(window.location.href)
      startRouteChangeSpan(safeUrl)
    })
  }
}

export const isRoutingProvider = (value: unknown): value is RoutingProvider =>
  isObject(value) &&
    typeof value.resolveRoute === 'function' &&
    typeof value.onRouteChange === 'function'
