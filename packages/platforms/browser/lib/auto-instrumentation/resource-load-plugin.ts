import { type SpanContextStorage, type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from '../config'

interface ResourceTiming extends PerformanceResourceTiming {
  responseStatus?: number // https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/responseStatus
}

export function getHttpVersion (protocol: string) {
  switch (protocol) {
    case '':
      return undefined
    case 'http/1.0':
      return '1.0'
    case 'http/1.1':
      return '1.1'
    case 'h2':
    case 'h2c':
      return '2.0'
    case 'h3':
      return '3.0'
    case 'spdy/1':
    case 'spdy/2':
    case 'spdy/3':
      return 'SPDY'
    default:
      return protocol
  }
}

function resourceLoadSupported (PerformanceObserverClass: typeof PerformanceObserver) {
  return PerformanceObserverClass &&
    Array.isArray(PerformanceObserverClass.supportedEntryTypes) &&
    PerformanceObserverClass.supportedEntryTypes.includes('resource')
}

export class ResourceLoadPlugin implements Plugin<BrowserConfiguration> {
  constructor (
    private readonly spanFactory: SpanFactory,
    private readonly spanContextStorage: SpanContextStorage,
    private readonly PerformanceObserverClass: typeof PerformanceObserver
  ) {}

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    if (!resourceLoadSupported(this.PerformanceObserverClass)) return

    const observer = new this.PerformanceObserverClass((list) => {
      const entries = list.getEntries() as ResourceTiming[]

      for (const entry of entries) {
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          continue
        }

        const parentContext = this.spanContextStorage.first

        if (parentContext) {
          const url = new URL(entry.name)
          url.search = ''
          const name = url.href

          const span = this.spanFactory.startSpan(`[ResourceLoad]${name}`, {
            parentContext,
            startTime: entry.startTime,
            makeCurrentContext: false
          })

          span.setAttribute('bugsnag.span.category', 'resource_load')
          span.setAttribute('http.url', entry.name)

          const httpFlavor = getHttpVersion(entry.nextHopProtocol)
          if (httpFlavor) {
            span.setAttribute('http.flavor', httpFlavor)
          }

          if (entry.encodedBodySize && entry.decodedBodySize) {
            span.setAttribute('http.response_content_length', entry.encodedBodySize)
            span.setAttribute('http.response_content_length_uncompressed', entry.decodedBodySize)
          }

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
