import { coreSpanOptionSchema, isString, validateSpanOptions, type InternalConfiguration, type Plugin, type SpanFactory, type SpanOptionSchema } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from '../config'
import { defaultRouteResolver } from '../default-routing-provider'
import { type RouteChangeSpanOptions } from '../routing-provider'
import { getPermittedAttributes } from '../send-page-attributes'

// exclude isFirstClass from the route change option schema
const { startTime, parentContext, makeCurrentContext } = coreSpanOptionSchema
const routeChangeSpanOptionSchema: SpanOptionSchema = {
  startTime,
  parentContext,
  makeCurrentContext,
  trigger: {
    getDefaultValue: (value) => String(value),
    message: 'should be a string',
    validate: isString
  }
}

interface InternalRouteChangeSpanOptions extends RouteChangeSpanOptions {
  url: URL
  trigger: string
}

export class RouteChangePlugin implements Plugin<BrowserConfiguration> {
  constructor (
    private readonly spanFactory: SpanFactory<BrowserConfiguration>,
    private readonly location: Location,
    private readonly document: Document
  ) {}

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    if (!configuration.autoInstrumentRouteChanges) return

    const previousUrl = new URL(this.location.href)
    let previousRoute = configuration.routingProvider.resolveRoute(previousUrl) || defaultRouteResolver(previousUrl)

    const permittedAttributes = getPermittedAttributes(configuration.sendPageAttributes)

    configuration.routingProvider.listenForRouteChanges((url, trigger, options) => {
      if (typeof url !== 'string' && !(url instanceof URL)) {
        configuration.logger.warn('Invalid span options\n  - url should be a URL')

        return {
          id: '',
          traceId: '',
          isValid: () => false,
          end: () => {}
        }
      }

      // convert a string to a URL for the route resolver
      if (typeof url === 'string') {
        url = new URL(url, this.document.baseURI)
      }

      // create internal options for validation
      const routeChangeSpanOptions = {
        ...options,
        trigger
      }

      const cleanOptions = validateSpanOptions<InternalRouteChangeSpanOptions>(
        '[RouteChange]',
        routeChangeSpanOptions,
        routeChangeSpanOptionSchema,
        configuration.logger
      )

      const route = configuration.routingProvider.resolveRoute(url) || defaultRouteResolver(url)

      // update the span name using the validated route
      cleanOptions.name += route
      const span = this.spanFactory.startSpan(cleanOptions.name, cleanOptions.options)

      span.setAttribute('bugsnag.span.category', 'route_change')
      span.setAttribute('bugsnag.browser.page.route', route)
      span.setAttribute('bugsnag.browser.page.previous_route', previousRoute)
      span.setAttribute('bugsnag.browser.page.route_change.trigger', cleanOptions.options.trigger)
      if (permittedAttributes.url) span.setAttribute('bugsnag.browser.page.url', url.toString())

      previousRoute = route

      return {
        id: span.id,
        traceId: span.traceId,
        isValid: span.isValid,
        end: (endTime) => {
          if (permittedAttributes.title) span.setAttribute('bugsnag.browser.page.title', this.document.title)
          this.spanFactory.toPublicApi(span).end(endTime)
        }
      }
    })
  }
}
