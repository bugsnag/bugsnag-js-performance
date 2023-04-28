import { type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/js-performance-core'
import { type BrowserConfiguration } from './config'
import LoadEventEndSettler from './on-settle/dom-mutation-settler'

export class PageLoadSpanPlugin implements Plugin<BrowserConfiguration> {
  private route = window.location.pathname // TODO: Get real route using configuration.routingProvider
  private spanFactory: SpanFactory

  constructor (spanFactory: SpanFactory) {
    this.spanFactory = spanFactory
  }

  get name () {
    return `[FullPageLoad]${this.route}`
  }

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    if (!configuration.autoInstrumentFullPageLoads) return

    // TODO: Send to method in configuration.routingProvider to update the route and name, and end the span
    const settler = new LoadEventEndSettler(document)
    settler.subscribe(() => {
      const startTime = 0 // TODO: Use PerformanceTiming
      const pageLoadSpan = this.spanFactory.startSpan(this.name, startTime)

      // TODO: Add page load span attributes

      // TODO: Add web vitals

      const endTime = performance.now() // TODO: Get end time from settler
      this.spanFactory.endSpan(pageLoadSpan, endTime)
    })
  }
}
