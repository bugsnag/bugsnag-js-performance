import type { SpanContextStorage, Plugin, SpanFactory, PluginContext, Logger } from '@bugsnag/core-performance'
import type { BrowserConfiguration } from '../config'
import { defaultNetworkRequestCallback } from '@bugsnag/request-tracker-performance'
import type { NetworkRequestCallback } from '@bugsnag/request-tracker-performance'
import type { BrowserNetworkRequestInfo } from './network-request-plugin'

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
    private readonly spanFactory: SpanFactory<BrowserConfiguration>,
    private readonly spanContextStorage: SpanContextStorage,
    private readonly PerformanceObserverClass: typeof PerformanceObserver
  ) {}

  private enabled: boolean = false
  private logger: Logger = { debug: console.debug, warn: console.warn, info: console.info, error: console.error }
  private networkRequestCallback: NetworkRequestCallback<BrowserNetworkRequestInfo> = defaultNetworkRequestCallback

  install (context: PluginContext<BrowserConfiguration>) {
    if (!resourceLoadSupported(this.PerformanceObserverClass)) return

    const { logger, networkRequestCallback } = context.configuration

    if (logger) this.logger = logger
    if (networkRequestCallback) this.networkRequestCallback = networkRequestCallback

    this.enabled = true
  }

  start () {
    if (!this.enabled) return

    const observer = new this.PerformanceObserverClass((list) => {
      const entries = list.getEntries() as ResourceTiming[]

      for (const entry of entries) {
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          continue
        }

        const parentContext = this.spanContextStorage.first

        if (parentContext) {
          const networkRequestInfo = this.networkRequestCallback({ url: entry.name, type: entry.initiatorType })

          if (!networkRequestInfo) return

          if (typeof networkRequestInfo.url !== 'string') {
            this.logger.warn(`expected url to be a string following network request callback, got ${typeof networkRequestInfo.url}`)
            return
          }

          let name = ''
          try {
            const url = new URL(networkRequestInfo.url)
            url.search = ''
            name = url.href
          } catch (err) {
            this.logger.warn(`Unable to parse URL returned from networkRequestCallback: ${networkRequestInfo.url}`)
            return
          }

          const span = this.spanFactory.startSpan(`[ResourceLoad]${name}`, {
            parentContext,
            startTime: entry.startTime,
            makeCurrentContext: false
          })

          span.setAttribute('bugsnag.span.category', 'resource_load')
          span.setAttribute('http.url', networkRequestInfo.url)

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

    try {
      observer.observe({ type: 'resource', buffered: true })
    } catch (err) {
      this.logger.warn('Unable to get previous resource loads as buffered observer not supported, only showing resource loads from this point on')
      observer.observe({ entryTypes: ['resource'] })
    }
  }
}
