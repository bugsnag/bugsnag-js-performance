import { type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from '../config'
import getAbsoluteUrl from '../request-tracker/url-helpers'

export class RouteChangePlugin implements Plugin<BrowserConfiguration> {
  constructor (
    private readonly spanFactory: SpanFactory,
    private readonly location: Location,
    private readonly document: Document
  ) {}

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    if (!configuration.autoInstrumentRouteChanges) return

    let previousRoute = configuration.routingProvider.resolveRoute(new URL(this.location.href))

    configuration.routingProvider.listenForRouteChanges((route, trigger, options) => {
      let warnings = ''
      if (typeof route !== 'string') {
        warnings += `\n - route should be a string, got ${typeof route}`
        route = String(route)
      }

      if (typeof trigger !== 'string') {
        warnings += `\n - trigger should be a string, got ${typeof trigger}`
        trigger = String(trigger)
      }

      if (warnings.length > 0) {
        configuration.logger.warn(`Invalid route change span options ${warnings}`)
      }

      const span = this.spanFactory.startSpan(`[RouteChange]${route}`, options)

      const url = getAbsoluteUrl(route, this.document.baseURI)

      span.setAttribute('bugsnag.span.category', 'route_change')
      span.setAttribute('bugsnag.browser.page.route', route)
      span.setAttribute('bugsnag.browser.page.url', url)
      span.setAttribute('bugsnag.browser.page.previous_route', previousRoute)
      span.setAttribute('bugsnag.browser.page.route_change.trigger', trigger)

      previousRoute = route

      return {
        id: span.id,
        traceId: span.traceId,
        isValid: span.isValid,
        end: (endTime) => {
          span.setAttribute('bugsnag.browser.page.title', this.document.title)
          this.spanFactory.toPublicApi(span).end(endTime)
        }
      }
    })
  }
}
