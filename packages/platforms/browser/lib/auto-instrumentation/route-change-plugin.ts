import { coreSpanOptionSchema, isString, isObject } from '@bugsnag/core-performance'
import type { InternalConfiguration, Plugin, Span, SpanFactory, SpanOptionSchema, Time } from '@bugsnag/core-performance'
import type { BrowserConfiguration } from '../config'
import type { RouteChangeSpanEndOptions, RouteChangeSpanOptions } from '../routing-provider'
import { getPermittedAttributes } from '../send-page-attributes'
import { defaultRouteResolver } from '../default-routing-provider'
import type { AppState } from '../../../../core/lib/core'

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
    private readonly document: Document,
    private readonly setAppState: (appState: AppState) => void
  ) {}

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    if (!configuration.autoInstrumentRouteChanges) return

    const previousUrl = new URL(this.location.href)
    let previousRoute = configuration.routingProvider.resolveRoute(previousUrl) || defaultRouteResolver(previousUrl)

    const permittedAttributes = getPermittedAttributes(configuration.sendPageAttributes)

    configuration.routingProvider.listenForRouteChanges((url, trigger, options) => {
      let absoluteUrl

      if (url instanceof URL) {
        absoluteUrl = url
      } else {
        try {
          const stringUrl = String(url)
          absoluteUrl = new URL(stringUrl)
        } catch (err) {
          configuration.logger.warn('Invalid span options\n  - url should be a URL')

          return {
            id: '',
            name: '',
            traceId: '',
            samplingRate: 0,
            isValid: () => false,
            setAttribute: () => {},
            end: () => {}
          } satisfies Span
        }
      }
      this.setAppState('navigating')
      // create internal options for validation
      const routeChangeSpanOptions = {
        ...options,
        trigger
      }

      const cleanOptions = this.spanFactory.validateSpanOptions<InternalRouteChangeSpanOptions>(
        '[RouteChange]',
        routeChangeSpanOptions,
        routeChangeSpanOptionSchema
      )

      const route = configuration.routingProvider.resolveRoute(absoluteUrl) || defaultRouteResolver(absoluteUrl)

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
        get id () {
          return span.id
        },
        get traceId () {
          return span.traceId
        },
        get samplingRate () {
          return span.samplingRate
        },
        get name () {
          return span.name
        },
        isValid: span.isValid,
        setAttribute: span.setAttribute,
        end: (endTimeOrOptions?: Time | RouteChangeSpanEndOptions): void => {
          const options: RouteChangeSpanEndOptions = isObject(endTimeOrOptions) ? endTimeOrOptions : { endTime: endTimeOrOptions }

          if (permittedAttributes.title) {
            span.setAttribute('bugsnag.browser.page.title', this.document.title)
          }

          if (options.url) {
            const urlObject = ensureUrl(options.url) // convert strings to URL if necessary
            const route = configuration.routingProvider.resolveRoute(urlObject) || defaultRouteResolver(urlObject)

            span.name = `[RouteChange]${route}`
            span.setAttribute('bugsnag.browser.page.route', route)
            previousRoute = route

            // update the URL attribute as well
            if (permittedAttributes.url) {
              span.setAttribute('bugsnag.browser.page.url', urlObject.toString())
            }
          }

          this.spanFactory.toPublicApi(span).end(options.endTime)
          this.setAppState('ready')
        }

      } satisfies Span
    })
  }
}

function ensureUrl (url: string | URL): URL {
  if (typeof url === 'string') {
    return new URL(url)
  }
  return url
}
