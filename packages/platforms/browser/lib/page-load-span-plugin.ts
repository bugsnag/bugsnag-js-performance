import { type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/js-performance-core'
import { type BrowserConfiguration } from './config'
import LoadEventEndSettler from './on-settle/dom-mutation-settler'

export class PageLoadSpanPlugin implements Plugin<BrowserConfiguration> {
  private spanFactory: SpanFactory
  private route: string

  constructor (spanFactory: SpanFactory, route: string) {
    this.spanFactory = spanFactory
    this.route = route
  }

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    if (!configuration.autoInstrumentFullPageLoads) return

    // TODO: Send to method in configuration.routingProvider to update the route and name, and end the span
    const settler = new LoadEventEndSettler(document)
    settler.subscribe(() => {
      const startTime = 0 // TODO: Use PerformanceTiming
      const pageLoadSpan = this.spanFactory.startSpan(`[FullPageLoad]${this.route}`, startTime)

      pageLoadSpan.setAttribute('bugsnag.span.category', 'full_page_load')
      pageLoadSpan.setAttribute('bugsnag.browser.page.route', this.route) // TODO: Add using route resolve function
      pageLoadSpan.setAttribute('bugsnag.browser.page.url', window.location.href)
      pageLoadSpan.setAttribute('bugsnag.browser.page.referrer', document.referrer)
      pageLoadSpan.setAttribute('bugsnag.browser.page.title', document.title)

      // TODO: Add web vitals

      const endTime = performance.now() // TODO: Get end time from settler
      this.spanFactory.endSpan(pageLoadSpan, endTime)
    })
  }
}
