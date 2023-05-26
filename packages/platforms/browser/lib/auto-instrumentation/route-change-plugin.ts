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
    // if (!configuration.autoInstrumentRouteChanges) return

    configuration.routingProvider.onRouteChange((currentRoute: string, previousRoute: string, startTime: number) => {
      const span = this.spanFactory.startSpan(`[RouteChange]${currentRoute}`, startTime)
      span.setAttribute('bugsnag.span.category', 'route_change')
      span.setAttribute('bugsnag.browser.page.route', currentRoute)
      span.setAttribute('bugsnag.browser.page.previous_route', previousRoute)

      this.onSettle((endTime) => {
        this.spanFactory.endSpan(span, endTime)
      })
    }, this.clock)
  }
}
