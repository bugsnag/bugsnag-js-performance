import {
  type RequestTracker,
  type RequestStartContext,
  type RequestEndContext,
  type RequestEndCallback
} from '../request-tracker/request-tracker'
import { type SpanFactory, type Plugin, type InternalConfiguration } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from '../config'

export class NetworkRequestPlugin implements Plugin<BrowserConfiguration> {
  private configEndpoint: string = ''

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
    }
  }

  private trackRequest = (startContext: RequestStartContext): RequestEndCallback | undefined => {
    if (!this.shouldTrackRequest(startContext)) return

    const span = this.spanFactory.startSpan(
      `[HTTP]/${startContext.method.toUpperCase()}`,
      { startTime: startContext.startTime, makeCurrentContext: false }
    )

    span.setAttribute('bugsnag.span.category', 'network')
    span.setAttribute('http.url', startContext.url)
    span.setAttribute('http.method', startContext.method)

    return (endContext: RequestEndContext) => {
      if (endContext.state === 'success') {
        span.setAttribute('http.status_code', endContext.status)
        this.spanFactory.endSpan(span, endContext.endTime)
      }
    }
  }

  private shouldTrackRequest (startContext: RequestStartContext): boolean {
    return !startContext.url.includes(this.configEndpoint)
  }
}
