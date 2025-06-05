import { getAppState, setAppState } from '@bugsnag/core-performance'
import type { ParentContext, BackgroundingListener, Plugin, SpanFactory, PluginContext } from '@bugsnag/core-performance'
import type { BrowserConfiguration } from '../config'
import type { OnSettle } from '../on-settle'
import type { PerformanceWithTiming } from '../on-settle/load-event-end-settler'
import { defaultSendPageAttributes, getPermittedAttributes } from '../send-page-attributes'
import type { SendPageAttributes } from '../send-page-attributes'
import type { WebVitals } from '../web-vitals'
import { instrumentPageLoadPhaseSpans } from './page-load-phase-spans'
import { defaultRouteResolver } from '../default-routing-provider'
import type { RouteResolver } from '../routing-provider'

export class FullPageLoadPlugin implements Plugin<BrowserConfiguration> {
  private readonly spanFactory: SpanFactory<BrowserConfiguration>
  private readonly document: Document
  private readonly location: Location
  private readonly onSettle: OnSettle
  private readonly webVitals: WebVitals
  private readonly performance: PerformanceWithTiming

  // if the page was backgrounded at any point in the loading process a page
  // load span is invalidated as the browser will deprioritise the page
  private wasBackgrounded: boolean = false

  private enabled: boolean = false
  private routeResolver: RouteResolver = defaultRouteResolver
  private sendPageAttributes: SendPageAttributes = defaultSendPageAttributes

  constructor (
    document: Document,
    location: Location,
    spanFactory: SpanFactory<BrowserConfiguration>,
    webVitals: WebVitals,
    onSettle: OnSettle,
    backgroundingListener: BackgroundingListener,
    performance: PerformanceWithTiming
  ) {
    this.document = document
    this.location = location
    this.spanFactory = spanFactory
    this.webVitals = webVitals
    this.onSettle = onSettle
    this.performance = performance

    backgroundingListener.onStateChange(state => {
      if (!this.wasBackgrounded && state === 'in-background') {
        this.wasBackgrounded = true
      }
    })
  }

  install (context: PluginContext<BrowserConfiguration>) {
    // don't report a page load span if the option is turned off or the page was
    // backgrounded at any point in the loading process
    if (!context.configuration.autoInstrumentFullPageLoads || this.wasBackgrounded) {
      return
    }

    const { routingProvider, sendPageAttributes } = context.configuration
    if (routingProvider) this.routeResolver = routingProvider.resolveRoute
    if (sendPageAttributes) this.sendPageAttributes = sendPageAttributes

    this.enabled = true
  }

  start () {
    if (!this.enabled) return

    let parentContext: ParentContext | null = null

    const traceparentMetaTag = document.querySelector('meta[name="traceparent"]')
    if (traceparentMetaTag !== null && traceparentMetaTag.getAttribute('content')) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const traceparent = traceparentMetaTag.getAttribute('content')!
      const [, traceId, parentSpanId] = traceparent.split('-')

      parentContext = {
        traceId,
        id: parentSpanId
      }
    }

    const span = this.spanFactory.startSpan('[FullPageLoad]', { startTime: 0, parentContext })
    const permittedAttributes = getPermittedAttributes(this.sendPageAttributes || defaultSendPageAttributes)
    const url = new URL(this.location.href)

    this.onSettle((endTime: number) => {
      if (this.wasBackgrounded) return

      // ensure there's always a route on this span by falling back to the
      // default route resolver - the pipeline will ignore page load spans that
      // don't have a route
      const route = this.routeResolver(url) || defaultRouteResolver(url)
      span.name += route

      instrumentPageLoadPhaseSpans(this.spanFactory, this.performance, route, span)

      // Browser attributes
      span.setAttribute('bugsnag.span.category', 'full_page_load')
      span.setAttribute('bugsnag.browser.page.route', route)
      if (permittedAttributes.referrer) span.setAttribute('bugsnag.browser.page.referrer', this.document.referrer)
      if (permittedAttributes.title) span.setAttribute('bugsnag.browser.page.title', this.document.title)
      if (permittedAttributes.url) span.setAttribute('bugsnag.browser.page.url', url.toString())

      this.webVitals.attachTo(span)
      this.spanFactory.endSpan(span, endTime)
      if (getAppState() === 'starting') {
        setAppState('ready')
      }
    })
  }
}
