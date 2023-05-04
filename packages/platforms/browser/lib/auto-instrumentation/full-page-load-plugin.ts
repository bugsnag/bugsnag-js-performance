import { type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/js-performance-core'
import { type BrowserConfiguration } from '../config'

export class FullPageLoadPlugin implements Plugin<BrowserConfiguration> {
  private spanFactory: SpanFactory
  private document: Document
  private location: Location
  private onSettle: (callback: () => void) => void

  constructor (document: Document, location: Location, spanFactory: SpanFactory) {
    this.document = document
    this.location = location
    this.spanFactory = spanFactory

    // TODO: Implement real settling function
    this.onSettle = (callback: () => void) => {
      callback()
    }
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
    span.setAttribute('bugsnag.browser.page.title', this.document.title)
    span.setAttribute('bugsnag.browser.page.url', this.location.href)

    this.onSettle(() => {
      // TODO: Attach web vitals
      const safeEndTime = performance.now()
      this.spanFactory.endSpan(span, safeEndTime)
    })
  }
}
