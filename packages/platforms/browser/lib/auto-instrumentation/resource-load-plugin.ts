import { type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from '../config'

interface ResourceTiming extends PerformanceResourceTiming {
  responseStatus?: number // https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/responseStatus
}

export class ResourceLoadPlugin implements Plugin<BrowserConfiguration> {
  constructor (
    private readonly spanFactory: SpanFactory,
    private readonly PerformanceObserverClass: typeof PerformanceObserver
  ) {}

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    const observer = new this.PerformanceObserverClass((list) => {
      const entries = list.getEntries() as ResourceTiming[]

      for (const entry of entries) {
        const parentContext = this.spanFactory.firstSpanContext

        if (parentContext) {
          const url = new URL(entry.name)
          const name = url.href.replace(url.search, '')

          const span = this.spanFactory.startSpan(`[ResourceLoad]${name}`, {
            parentContext,
            startTime: entry.startTime,
            makeCurrentContext: false
          })

          span.setAttribute('http.url', entry.name)

          if (entry.responseStatus) {
            span.setAttribute('http.status_code', entry.responseStatus)
          }

          this.spanFactory.endSpan(span, entry.responseEnd)
        }
      }
    })

    observer.observe({ type: 'resource', buffered: true })
  }
}
