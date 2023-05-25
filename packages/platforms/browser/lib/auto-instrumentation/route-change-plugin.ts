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
  private previousUrl = sanitizeUrl(window.location.href)

  constructor (spanFactory: SpanFactory, onSettle: OnSettle, clock: Clock) {
    this.spanFactory = spanFactory
    this.onSettle = onSettle
    this.clock = clock
  }

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    // if (!configuration.autoInstrumentRouteChanges) return

    const startRouteChangeSpan = (url: URL, previousUrl: URL) => {
      const startTime = this.clock.now()
      const route = configuration.routingProvider.resolveRoute(url)
      const previousRoute = configuration.routingProvider.resolveRoute(previousUrl)
      const span = this.spanFactory.startSpan(`[RouteChange]${route}`, startTime)

      span.setAttribute('bugsnag.span.category', 'route_change')
      span.setAttribute('bugsnag.browser.page.route', route)
      span.setAttribute('bugsnag.browser.page.previous_route', previousRoute)

      this.onSettle((endTime) => {
        this.spanFactory.endSpan(span, endTime)
      })
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
          const safeUrl = sanitizeUrl(url)
          startRouteChangeSpan(safeUrl, previousUrl)
          setPreivousUrl(safeUrl)
        } catch (err) {
          console.error(err)
        }
      }

      originalPushState.apply(this, args)
    }
  }
}
