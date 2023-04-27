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

    // Page load attributes
    pageLoadSpan.setAttribute('bugsnag.span.category', 'full_page_load')
    pageLoadSpan.setAttribute('bugsnag.browser.page.route', this.route) // TODO: Add using route resolve function
    pageLoadSpan.setAttribute('bugsnag.browser.page.url', window.location.href)
    pageLoadSpan.setAttribute('bugsnag.browser.page.referrer', document.referrer)
    pageLoadSpan.setAttribute('bugsnag.browser.page.title', document.title)

    // TODO: Set web vitals

    // TODO: Send to method in configuration.routingProvider to update the route and name, and end the span
    const endTime = 1234 // TODO: Get end time
    this.spanFactory.endSpan(pageLoadSpan, endTime)
  }
}
