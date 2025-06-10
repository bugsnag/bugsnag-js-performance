import type { Logger, Plugin, PluginContext, Span, SpanFactory, SpanOptionSchema, Time } from '@bugsnag/core-performance'
import { coreSpanOptionSchema, isObject, isString, setAppState } from '@bugsnag/core-performance'
import type { BrowserConfiguration } from '../config'
import { defaultRouteResolver } from '../default-routing-provider'
import type { RouteChangeSpanEndOptions, RouteChangeSpanOptions, RoutingProvider } from '../routing-provider'
import { defaultSendPageAttributes, getPermittedAttributes } from '../send-page-attributes'
import type { SendPageAttributes } from '../send-page-attributes'

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

  private enabled: boolean = false
  private routingProvider?: RoutingProvider
  private sendPageAttributes: SendPageAttributes = defaultSendPageAttributes
  private logger: Logger = { debug: console.debug, warn: console.warn, info: console.info, error: console.error }

  install (context: PluginContext<BrowserConfiguration>) {
    if (!context.configuration.autoInstrumentRouteChanges) return

    const { logger, routingProvider, sendPageAttributes } = context.configuration
    if (logger) this.logger = logger
    if (routingProvider) this.routingProvider = routingProvider
    if (sendPageAttributes) this.sendPageAttributes = sendPageAttributes

    this.enabled = true
  }

  start () {
    if (!this.enabled) return

    const previousUrl = new URL(this.location.href)
    let previousRoute = this.routingProvider?.resolveRoute(previousUrl) || defaultRouteResolver(previousUrl)

    const permittedAttributes = getPermittedAttributes(this.sendPageAttributes)

    this.routingProvider?.listenForRouteChanges((url, trigger, options) => {
      let absoluteUrl

      if (url instanceof URL) {
        absoluteUrl = url
      } else {
        try {
          const stringUrl = String(url)
          absoluteUrl = new URL(stringUrl)
        } catch (err) {
          this.logger.warn('Invalid span options\n  - url should be a URL')

          return {
            id: '',
            name: '',
            traceId: '',
            samplingRate: 0,
            samplingProbability: 0,
            isValid: () => false,
            setAttribute: () => {},
            end: () => {}
          } satisfies Span
        }
      }
      setAppState('navigating')
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

      const route = this.routingProvider?.resolveRoute(absoluteUrl) || defaultRouteResolver(absoluteUrl)

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
        get samplingProbability () {
          return span.samplingProbability
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
            const route = this.routingProvider?.resolveRoute(urlObject) || defaultRouteResolver(urlObject)

            span.name = `[RouteChange]${route}`
            span.setAttribute('bugsnag.browser.page.route', route)
            previousRoute = route

            // update the URL attribute as well
            if (permittedAttributes.url) {
              span.setAttribute('bugsnag.browser.page.url', urlObject.toString())
            }
          }

          this.spanFactory.toPublicApi(span).end(options.endTime)

          setAppState('ready')
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
