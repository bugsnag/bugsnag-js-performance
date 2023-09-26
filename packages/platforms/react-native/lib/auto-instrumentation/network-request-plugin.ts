import {
  type InternalConfiguration,
  type Logger,
  type Plugin,
  type SpanFactory
} from '@bugsnag/core-performance'
import {
  defaultNetworkRequestCallback,
  type NetworkRequestCallback,
  type NetworkRequestInfo,
  type RequestEndCallback,
  type RequestEndContext,
  type RequestStartContext,
  type RequestTracker
} from '@bugsnag/request-tracker-performance'
import { type ReactNativeConfiguration } from '../config'

const permittedPrefixes = ['http://', 'https://', '/', './', '../']

export interface ReactNativeNetworkRequestInfo extends NetworkRequestInfo {
  readonly type: 'xmlhttprequest'
}

export class NetworkRequestPlugin implements Plugin<ReactNativeConfiguration> {
  private configEndpoint: string = ''
  private networkRequestCallback: NetworkRequestCallback<ReactNativeNetworkRequestInfo> = defaultNetworkRequestCallback
  private logger: Logger = { debug: console.debug, warn: console.warn, info: console.info, error: console.error }

  constructor (
    private spanFactory: SpanFactory<ReactNativeConfiguration>,
    private xhrTracker: RequestTracker
  ) {}

  configure (configuration: InternalConfiguration<ReactNativeConfiguration>) {
    this.logger = configuration.logger

    if (configuration.autoInstrumentNetworkRequests) {
      this.configEndpoint = configuration.endpoint
      this.xhrTracker.onStart(this.trackRequest)
      this.networkRequestCallback = configuration.networkRequestCallback
    }
  }

  private trackRequest = (startContext: RequestStartContext): RequestEndCallback | undefined => {
    if (!this.shouldTrackRequest(startContext)) return

    const networkRequestInfo = this.networkRequestCallback({ url: startContext.url, type: 'xmlhttprequest' })

    if (!networkRequestInfo) return

    if (typeof networkRequestInfo.url !== 'string') {
      this.logger.warn(`expected url to be a string following network request callback, got ${typeof networkRequestInfo.url}`)
      return
    }

    const span = this.spanFactory.startSpan(
      `[HTTP]/${startContext.method.toUpperCase()}`,
      { startTime: startContext.startTime, makeCurrentContext: false }
    )

    span.setAttribute('bugsnag.span.category', 'network')
    span.setAttribute('http.method', startContext.method)
    span.setAttribute('http.url', networkRequestInfo.url)

    return (endContext: RequestEndContext) => {
      if (endContext.state === 'success') {
        span.setAttribute('http.status_code', endContext.status)
        this.spanFactory.endSpan(span, endContext.endTime)
      }
    }
  }

  private shouldTrackRequest (startContext: RequestStartContext): boolean {
    return startContext.url !== this.configEndpoint && permittedPrefixes.some((prefix) => startContext.url.startsWith(prefix))
  }
}
