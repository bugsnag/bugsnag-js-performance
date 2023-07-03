import { type SpanOptionSchema, isString, coreSpanOptionSchema, validateSpanOptions, type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from '../config'
import getAbsoluteUrl from '../request-tracker/url-helpers'
import { type RouteChangeSpanOptions } from '../routing-provider'

// exclude isFirstClass from the route change option schema
const { isFirstClass, ...baseSpanOptionSchema } = coreSpanOptionSchema
const routeChangeSpanOptionSchema: SpanOptionSchema = {
  ...baseSpanOptionSchema,
  route: {
    getDefaultValue: (value) => String(value),
    message: 'should be a string',
    validate: isString
  },
  trigger: {
    getDefaultValue: (value) => String(value),
    message: 'should be a string',
    validate: isString
  }
}

interface InternalRouteChangeSpanOptions extends RouteChangeSpanOptions {
  route: string
  trigger: string
}

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
      // create internal options for validation
      const routeChangeSpanOptions = {
        ...options,
        route,
        trigger
      }

      const cleanOptions = validateSpanOptions<InternalRouteChangeSpanOptions>(
        '[RouteChange]',
        routeChangeSpanOptions,
        routeChangeSpanOptionSchema,
        configuration.logger
      )

      // update the span name using the validated route
      cleanOptions.name += cleanOptions.options.route
      const span = this.spanFactory.startSpan(cleanOptions.name, cleanOptions.options)

      const url = getAbsoluteUrl(cleanOptions.options.route, this.document.baseURI)

      span.setAttribute('bugsnag.span.category', 'route_change')
      span.setAttribute('bugsnag.browser.page.route', route)
      span.setAttribute('bugsnag.browser.page.url', url)
      span.setAttribute('bugsnag.browser.page.previous_route', previousRoute)
      span.setAttribute('bugsnag.browser.page.route_change.trigger', cleanOptions.options.trigger)

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
