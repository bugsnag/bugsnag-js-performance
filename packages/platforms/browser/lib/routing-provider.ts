import { isObject, type Clock, type SpanFactory, type SpanInternal } from '@bugsnag/core-performance'

type RouteChangeSpanCallback = (routeChangeSpan: SpanInternal) => void

export interface RoutingProvider {
  resolveRoute: RouteResolver
  initialize: (spanFactory: SpanFactory, clock: Clock, routeChangeSpanCallback: RouteChangeSpanCallback) => void
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
  private previousUrl = sanitizeUrl(window.location.href)

  constructor (resolveRoute = defaultRouteResolver) {
    this.resolveRoute = resolveRoute
  }

  initialize (spanFactory: SpanFactory, clock: Clock, routeChangeSpanCallback: RouteChangeSpanCallback) {
    const startRouteChangeSpan = (url: URL, previousUrl: URL) => {
      const startTime = clock.now()
      const route = this.resolveRoute(url)
      const previousRoute = this.resolveRoute(previousUrl)
      const span = spanFactory.startSpan(`[RouteChange]${route}`, startTime)

      span.setAttribute('bugsnag.span.category', 'route_change')
      span.setAttribute('bugsnag.browser.page.route', route)
      span.setAttribute('bugsnag.browser.page.previous_route', previousRoute)

      return span
    }

    const setPreivousUrl = (url: URL) => {
      this.previousUrl = url
    }

    const previousUrl = this.previousUrl

    const originalPushState = history.pushState
    history.pushState = function (...args) {
      const url = args[2]

      if (url) {
        try {
          const newUrl = sanitizeUrl(url)
          const span = startRouteChangeSpan(newUrl, previousUrl)
          routeChangeSpanCallback(span)
          setPreivousUrl(newUrl)
        } catch (err) {
          console.error(err)
        }
      }

      originalPushState.apply(this, args)
    }

    addEventListener('popstate', () => {
      const newUrl = sanitizeUrl(window.location.href)

      const span = startRouteChangeSpan(newUrl, previousUrl)
      routeChangeSpanCallback(span)
      setPreivousUrl(newUrl)
    })
  }
}

export const isRoutingProvider = (value: unknown): value is RoutingProvider =>
  isObject(value) &&
    typeof value.resolveRoute === 'function'
