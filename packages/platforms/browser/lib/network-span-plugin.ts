import {
  type RequestTracker,
  type RequestStartContext,
  type RequestEndContext,
  type RequestEndContextSuccess,
  type RequestEndCallback
} from './request-tracker/request-tracker'
import { type SpanFactory, type Plugin, type InternalConfiguration } from '@bugsnag/js-performance-core'

export default class NetworkSpanPlugin implements Plugin {
  constructor (
    private spanFactory: SpanFactory,
    private fetchTracker: RequestTracker,
    private xhrTracker: RequestTracker
  ) {}

  configure (configuration: InternalConfiguration) {
    // @ts-expect-error autoInstrumentNetworkRequests
    if (configuration.autoInstrumentNetworkRequests) {
      this.xhrTracker.onStart(this.trackRequest)
      this.fetchTracker.onStart(this.trackRequest)
    }
  }

  private trackRequest = (startContext: RequestStartContext): RequestEndCallback => {
    // TODO: set span attributes
    const span = this.spanFactory.startSpan(`[HTTP]/${startContext.method.toUpperCase()}`, startContext.startTime)

    return (endContext: RequestEndContext) => {
      const status = (endContext as RequestEndContextSuccess).status
      if (status > 0) {
        this.spanFactory.endSpan(span, endContext.endTime)
      }
    }
  }
}
