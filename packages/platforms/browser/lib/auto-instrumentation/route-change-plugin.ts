import { type SpanFactory, type Span } from '@bugsnag/js-performance-core'

export const startRouteChangeSpan = (spanFactory: SpanFactory, route: string): Span => {
  const startTime = performance.now()

  return {
    end: (endTime) => {
      const span = spanFactory.startSpan(`[RouteChange]/${route}`, startTime)

      span.setAttribute('bugsnag.span.category', 'route-change')
      span.setAttribute('bugsnag.browser.page.route', route)
      span.setAttribute('bugsnag.browser.page.previous_route', '') // TODO: Get previous route
      span.setAttribute('bugsnag.browser.page.url', window.location.href)
      span.setAttribute('bugsnag.browser.page.title', document.title)

      // TODO: use and sanitize endTime parameter
      const safeEndTime = performance.now()

      spanFactory.endSpan(span, safeEndTime)
    }
  }
}
