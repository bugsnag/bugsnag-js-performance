import { type Clock, type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/js-performance-core'
import { type BrowserConfiguration } from '../config'
import { type OnSettle } from '../on-settle'

const sanitizeUrl = (url: string | URL) => {
  if (url instanceof URL) return url

  if (!url.startsWith('http')) {
    const fullUrl = window.location.origin.replace(window.location.port, '') + url
    return new URL(fullUrl)
  }

  return new URL(url)
}

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
    history.pushState = function (...args) {
      const url = args[2]

      if (url) {
        try {
          const safeUrl = sanitizeUrl(url)
          handleRouteChange(safeUrl)
        } catch (err) {
          console.error(err)
        }
      }

      originalPushState.apply(this, args)
    }
  }
}
