import { timeToNumber, type Clock, type InternalConfiguration, type Plugin, type Span, type SpanFactory, type Time } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from '../config'

interface StartRouteOptions {
  startTime?: Time
}

export type StartRouteChangeSpan = (route: string, options?: StartRouteOptions) => Span

export class RouteChangePlugin implements Plugin<BrowserConfiguration> {
  private readonly spanFactory: SpanFactory
  private readonly clock: Clock

  constructor (spanFactory: SpanFactory, clock: Clock) {
    this.spanFactory = spanFactory
    this.clock = clock
  }

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    if (!configuration.autoInstrumentRouteChanges) return

    let previousRoute = configuration.routingProvider.initialRoute

    configuration.routingProvider.onRouteChange((newRoute: string, routeChangeTime?: Time) => {
      const startTime = routeChangeTime === undefined
        ? this.clock.now()
        : timeToNumber(this.clock, routeChangeTime)

      const span = this.spanFactory.startSpan(`[RouteChange]${newRoute}`, startTime)
      span.setAttribute('bugsnag.span.category', 'route_change')
      span.setAttribute('bugsnag.browser.page.route', newRoute)
      span.setAttribute('bugsnag.browser.page.previous_route', previousRoute)

      previousRoute = newRoute

      configuration.routingProvider.onSettle((settledTime?: Time) => {
        const endTime = settledTime === undefined
          ? this.clock.now()
          : timeToNumber(this.clock, settledTime)

        this.spanFactory.endSpan(span, endTime)
      })
    })
  }
}
