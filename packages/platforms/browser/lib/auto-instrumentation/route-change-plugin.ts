import { timeToNumber, type Clock, type InternalConfiguration, type Plugin, type Span, type SpanFactory, type Time } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from '../config'
import { type OnSettle } from '../on-settle'

interface StartRouteOptions {
  startTime?: Time
  previousRoute?: string
}

export type StartRouteChangeSpan = (route: string, options?: StartRouteOptions) => Span

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
    // if (!configuration.autoInstrumentRouteChanges) return

    let previousRoute = configuration.routingProvider.getInitialRoute()

    const startRouteChangeSpan = (route: string, options: StartRouteOptions = {}) => {
      const startTime = options?.startTime ? timeToNumber(this.clock, options.startTime) : this.clock.now()
      const span = this.spanFactory.startSpan(`[RouteChange]${route}`, startTime)
      span.setAttribute('bugsnag.span.category', 'route_change')
      span.setAttribute('bugsnag.browser.page.route', route)
      span.setAttribute('bugsnag.browser.page.previous_route', previousRoute)

      previousRoute = route

      const end = (endTime?: Time) => {
        const safeTime = timeToNumber(this.clock, endTime)
        this.spanFactory.endSpan(span, safeTime)
      }

      return { end }
    }

    configuration.routingProvider.configure(startRouteChangeSpan, this.onSettle)
  }
}
