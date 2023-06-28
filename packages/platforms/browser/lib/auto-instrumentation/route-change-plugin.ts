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
      const span = this.spanFactory.startSpan(`[RouteChange]${route}`, {
        startTime: options ? options.startTime : undefined
      })

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
