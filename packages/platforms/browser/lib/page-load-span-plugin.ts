import { type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/js-performance-core'
import { type BrowserConfiguration } from './config'

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

    const startTime = 0 // TODO: Get start time
    const pageLoadSpan = this.spanFactory.startSpan(this.name, startTime)

    // TODO: Page load span attributes

    // TODO: Set web vitals

    // TODO: Send to method in configuration.routingProvider to update the route and name, and end the span
    const endTime = 1234 // TODO: Get end time
    this.spanFactory.endSpan(pageLoadSpan, endTime)
  }
}
