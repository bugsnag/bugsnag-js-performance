import { type SpanFactory, type Plugin, type InternalConfiguration } from '@bugsnag/js-performance-core'

export class PageLoadSpanPlugin implements Plugin {
  private route = window.location.pathname
  private spanFactory: SpanFactory | undefined

  get name () {
    return `[FullPageLoad]${this.route}`
  }

  load (spanFactory: SpanFactory) {
    this.spanFactory = spanFactory
  }

  configure (configuration: InternalConfiguration) {
    if (!this.spanFactory) throw new Error('configure called before load')

    const startTime = 0 // TODO: Get start time
    const pageLoadSpan = this.spanFactory.startSpan(this.name, startTime)

    // TODO: Set web vitals and attributes

    // TODO: Send to method in configuration.routingProvider to update the route and name, and end the span
    const endTime = 1234 // TODO: Get end time
    this.spanFactory.endSpan(pageLoadSpan, endTime)
  }
}
