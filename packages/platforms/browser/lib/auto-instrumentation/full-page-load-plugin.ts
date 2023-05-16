import { type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/js-performance-core'
import { type BrowserConfiguration } from '../config'
import { type OnSettle } from '../on-settle'

export class FullPageLoadPlugin implements Plugin<BrowserConfiguration> {
  private spanFactory: SpanFactory
  private document: Document
  private location: Location
  private onSettle: OnSettle

  constructor (
    document: Document,
    location: Location,
    spanFactory: SpanFactory,
    onSettle: OnSettle
  ) {
    this.document = document
    this.location = location
    this.spanFactory = spanFactory
    this.onSettle = onSettle
  }

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    if (!configuration.autoInstrumentFullPageLoads) return

    const route = configuration.routingProvider.resolveRoute(new URL(window.location.href))

    const startTime = 0 // TODO: Ensure this correctly resolves to timeOrigin
    const span = this.spanFactory.startSpan(`[FullPageLoad]${route}`, startTime)

    // Browser attributes
    span.setAttribute('bugsnag.span.category', 'full_page_load')
    span.setAttribute('bugsnag.browser.page.referrer', this.document.referrer)
    span.setAttribute('bugsnag.browser.page.route', route)

    this.onSettle((endTime: number) => {
      // TODO: Attach web vitals
      this.spanFactory.endSpan(span, endTime)
    })
  }
}
