import { timeToNumber, type Clock, type InternalConfiguration, type Plugin, type SpanFactory, type Time } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from '../config'

export class RouteChangePlugin implements Plugin<BrowserConfiguration> {
  private readonly spanFactory: SpanFactory
  private readonly clock: Clock
  private readonly location: Location

  constructor (spanFactory: SpanFactory, clock: Clock, location: Location) {
    this.spanFactory = spanFactory
    this.clock = clock
    this.location = location
  }

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    if (!configuration.autoInstrumentRouteChanges) return

    let previousRoute = configuration.routingProvider.resolveRoute(new URL(this.location.href))

    configuration.routingProvider.listenForRouteChanges((newRoute, options = {}) => {
      const startTime = timeToNumber(this.clock, options.startTime)
      const span = this.spanFactory.startSpan(`[RouteChange]${newRoute}`, startTime)
      span.setAttribute('bugsnag.span.category', 'route_change')
      span.setAttribute('bugsnag.browser.page.route', newRoute)
      span.setAttribute('bugsnag.browser.page.previous_route', previousRoute)

      if (options.trigger) {
        span.setAttribute('bugsnag.browser.page.route_change.trigger', options.trigger)
      }

      previousRoute = newRoute

      return {
        end: (endTime?: Time) => {
          const realEndTime = timeToNumber(this.clock, endTime)
          this.spanFactory.endSpan(span, realEndTime)
        }
      }
    })
  }
}
