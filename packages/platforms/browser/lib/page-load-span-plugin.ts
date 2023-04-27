import { type SpanFactory, type Plugin, type InternalConfiguration } from '@bugsnag/js-performance-core'

export class PageLoadSpanPlugin implements Plugin {
  private route = window.location.pathname
  private spanFactory: SpanFactory

  constructor (spanFactory: SpanFactory) {
    this.spanFactory = spanFactory
  }

  get name () {
    return `[FullPageLoad]${this.route}`
  }

  configure (configuration: InternalConfiguration) {
    // @ts-expect-error Property does not exist on InternalConfiguration
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
