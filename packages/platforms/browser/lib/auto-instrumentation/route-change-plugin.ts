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

    configuration.routingProvider.initialize(this.spanFactory, this.clock, (routeChangeSpan) => {
      this.onSettle((endTime) => {
        this.spanFactory.endSpan(routeChangeSpan, endTime)
      })
    })
  }
}
