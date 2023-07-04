import { coreSpanOptionSchema, isString, validateSpanOptions, type InternalConfiguration, type Plugin, type SpanFactory, type SpanOptionSchema } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from '../config'
import { type RouteChangeSpanOptions } from '../routing-provider'

// exclude isFirstClass from the route change option schema
const { startTime, parentContext, makeCurrentContext } = coreSpanOptionSchema
const routeChangeSpanOptionSchema: SpanOptionSchema = {
  startTime,
  parentContext,
  makeCurrentContext,
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

    configuration.routingProvider.listenForRouteChanges((url, trigger, options) => {
      const route = configuration.routingProvider.resolveRoute(url)

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

      span.setAttribute('bugsnag.span.category', 'route_change')
      span.setAttribute('bugsnag.browser.page.route', route)
      span.setAttribute('bugsnag.browser.page.url', url.toString())
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
