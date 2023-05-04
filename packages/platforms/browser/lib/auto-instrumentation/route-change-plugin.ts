import { type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/js-performance-core'
import { type BrowserConfiguration } from '../config'

export class RouteChangePlugin implements Plugin<BrowserConfiguration> {
  private spanFactory: SpanFactory
  private onSettle: (callback: () => void) => void

  constructor (spanFactory: SpanFactory) {
    this.spanFactory = spanFactory

    // TODO: Implement real settling function
    this.onSettle = (callback: () => void) => {
      callback()
    }
  }

  startRouteChangeSpan (route: string) {
    const startTime = performance.now()
    const span = this.spanFactory.startSpan(`[RouteChange]${route}`, startTime)

    span.setAttribute('bugsnag.span.category', 'route_change')
    span.setAttribute('bugsnag.browser.page.route', route)
    // TODO: span.setAttribute('bugsnag.browser.page.previous_route', route)

    this.onSettle(() => {
      // TODO: Attach web vitals
      const safeEndTime = performance.now()
      this.spanFactory.endSpan(span, safeEndTime)
    })
  }

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    // const route = configuration.routingProvider.resolveRoute(new URL(window.location.href))

    // TODO: Add event listener
  }
}
