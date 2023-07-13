import { type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from '../config'
import { defaultNetworkRequestCallback, type NetworkRequestCallback } from '../network-request-callback'
import {
  type RequestEndCallback,
  type RequestEndContext,
  type RequestStartContext,
  type RequestTracker
} from '../request-tracker/request-tracker'

export class NetworkRequestPlugin implements Plugin<BrowserConfiguration> {
  private configEndpoint: string = ''
  private networkRequestCallback: NetworkRequestCallback = defaultNetworkRequestCallback

  constructor (
    private spanFactory: SpanFactory,
    private fetchTracker: RequestTracker,
    private xhrTracker: RequestTracker
  ) {}

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    if (configuration.autoInstrumentNetworkRequests) {
      this.configEndpoint = configuration.endpoint
      this.xhrTracker.onStart(this.trackRequest)
      this.fetchTracker.onStart(this.trackRequest)
      this.networkRequestCallback = configuration.networkRequestCallback
    }
  }

  private trackRequest = (startContext: RequestStartContext): RequestEndCallback | undefined => {
    if (!this.shouldTrackRequest(startContext)) return

    const networkRequestInfo = this.networkRequestCallback({ url: startContext.url, type: startContext.method })

    if (!networkRequestInfo) return

    const span = this.spanFactory.startSpan(
      `[HTTP]/${startContext.method.toUpperCase()}`,
      { startTime: startContext.startTime, makeCurrentContext: false }
    )

    span.setAttribute('bugsnag.span.category', 'network')
    span.setAttribute('http.url', networkRequestInfo.url)
    span.setAttribute('http.method', startContext.method)

    return (endContext: RequestEndContext) => {
      if (endContext.state === 'success') {
        span.setAttribute('http.status_code', endContext.status)
        this.spanFactory.endSpan(span, endContext.endTime)
      }
    }
  }

  private shouldTrackRequest (startContext: RequestStartContext): boolean {
    return startContext.url !== this.configEndpoint
  }
}
