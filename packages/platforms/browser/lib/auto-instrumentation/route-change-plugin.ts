import { type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from '../config'

export class RouteChangePlugin implements Plugin<BrowserConfiguration> {
  private readonly spanFactory: SpanFactory
  private readonly location: Location

  constructor (spanFactory: SpanFactory, location: Location) {
    this.spanFactory = spanFactory
    this.location = location
  }

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    if (!configuration.autoInstrumentRouteChanges) return

    let previousRoute = configuration.routingProvider.resolveRoute(new URL(this.location.href))

    configuration.routingProvider.listenForRouteChanges((route, trigger, options) => {
      const span = this.spanFactory.startSpan(`[RouteChange]${route}`, {
        startTime: options ? options.startTime : undefined
      })

      span.setAttribute('bugsnag.span.category', 'route_change')
      span.setAttribute('bugsnag.browser.page.route', route)
      span.setAttribute('bugsnag.browser.page.previous_route', previousRoute)
      span.setAttribute('bugsnag.browser.page.route_change.trigger', trigger)

      previousRoute = route

      return this.spanFactory.toPublicApi(span)
    })
  }
}
