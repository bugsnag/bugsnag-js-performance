import { type Clock, type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/js-performance-core'
import { type BrowserConfiguration } from '../config'
import { type OnSettle } from '../on-settle'

export class RouteChangePlugin implements Plugin<BrowserConfiguration> {
  private spanFactory: SpanFactory
  private onSettle: OnSettle
  private clock: Clock

  constructor (spanFactory: SpanFactory, onSettle: OnSettle, clock: Clock) {
    this.spanFactory = spanFactory
    this.onSettle = onSettle
    this.clock = clock
  }

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    //   if (!configuration.autoInstrumentRouteChanges) return

    const handleRouteChange = (url: URL) => {
      const startTime = this.clock.now()
      const route = configuration.routingProvider.resolveRoute(url)
      const span = this.spanFactory.startSpan(`[RouteChange]${route}`, startTime)

      span.setAttribute('bugsnag.span.category', 'route_change')
      span.setAttribute('bugsnag.span.route', route)
      // span.setAttribute('bugsnag.span.previous_route', route) // TODO: How do we get this?

      this.onSettle((endTime) => {
        this.spanFactory.endSpan(span, endTime)
      })
    }

    // Push state
    const originalPushState = history.pushState
    history.pushState = function (data, unused, url) {
      if (url) {
        const safeUrl = typeof url === 'string' ? new URL(url) : url
        handleRouteChange(safeUrl)
      } else {
        // url is undefined or null - can we do anything about that?
      }

      originalPushState.apply(this, [data, unused, url])
    }

    const originalReplaceState = history.replaceState
    history.replaceState = function (data, unused, url) {
      if (url) {
        const safeUrl = typeof url === 'string' ? new URL(url) : url
        handleRouteChange(safeUrl)
      } else {
        // url is undefined or null - can we do anything about that?
      }

      originalReplaceState.apply(this, [data, unused, url])
    }
  }
}
