import { RemoteParentContext, traceIdToSamplingRate } from '@bugsnag/core-performance'
import type { Logger, Plugin, PluginContext, SpanContextStorage, SpanFactory } from '@bugsnag/core-performance'
import {
  defaultNetworkRequestCallback

} from '@bugsnag/request-tracker-performance'
import type { NetworkRequestCallback, NetworkRequestInfo, RequestEndContext, RequestStartCallback, RequestStartContext, RequestTracker } from '@bugsnag/request-tracker-performance'
import type { BrowserConfiguration } from '../config'

export interface BrowserNetworkRequestInfo extends NetworkRequestInfo {
  readonly type: PerformanceResourceTiming['initiatorType']

  /**
   * Experimental. Whether to propagate trace context by adding a `traceparent` header to the request.
   */
  propagateTraceContext?: boolean
}

const permittedPrefixes = ['http://', 'https://', '/', './', '../']

export class NetworkRequestPlugin implements Plugin<BrowserConfiguration> {
  private configEndpoint: string = ''
  private networkRequestCallback: NetworkRequestCallback<BrowserNetworkRequestInfo> = defaultNetworkRequestCallback
  private logger: Logger = { debug: console.debug, warn: console.warn, info: console.info, error: console.error }
  private enabled: boolean = false

  constructor (
    private spanFactory: SpanFactory<BrowserConfiguration>,
    private readonly spanContextStorage: SpanContextStorage,
    private fetchTracker: RequestTracker,
    private xhrTracker: RequestTracker
  ) {}

  install (context: PluginContext<BrowserConfiguration>) {
    if (!context.configuration.autoInstrumentNetworkRequests) {
      return
    }

    const { endpoint, logger, networkRequestCallback } = context.configuration

    if (logger) this.logger = logger
    if (endpoint) this.configEndpoint = endpoint
    if (networkRequestCallback) this.networkRequestCallback = networkRequestCallback

    this.enabled = true
  }

  start () {
    if (this.enabled) {
      this.xhrTracker.onStart(this.trackRequest)
      this.fetchTracker.onStart(this.trackRequest)
    }
  }

  private trackRequest: RequestStartCallback = (startContext) => {
    if (!this.shouldTrackRequest(startContext)) return

    const shouldPropagateTraceContextByDefault = false

    const defaultRequestInfo: BrowserNetworkRequestInfo = {
      url: startContext.url,
      type: startContext.type,
      propagateTraceContext: shouldPropagateTraceContextByDefault
    }

    const networkRequestInfo = this.networkRequestCallback(defaultRequestInfo)

    // returning null neither creates a span nor propagates trace context
    if (!networkRequestInfo) {
      return {
        onRequestEnd: undefined,
        extraRequestHeaders: undefined
      }
    }

    if (networkRequestInfo.propagateTraceContext === undefined) {
      networkRequestInfo.propagateTraceContext = shouldPropagateTraceContextByDefault
    }

    // a span is not created if url is null
    if (!networkRequestInfo.url) {
      return {
        onRequestEnd: undefined,
        // propagate trace context if requested using span context
        extraRequestHeaders: networkRequestInfo.propagateTraceContext ? this.getExtraRequestHeaders() : undefined
      }
    }

    // otherwise, create a span and propagate trace context if requested
    if (typeof networkRequestInfo.url !== 'string') {
      this.logger.warn(`expected url to be a string following network request callback, got ${typeof networkRequestInfo.url}`)
      return
    }

    const span = this.spanFactory.startNetworkSpan({
      method: startContext.method,
      startTime: startContext.startTime,
      url: networkRequestInfo.url
    })

    return {
      onRequestEnd: (endContext: RequestEndContext) => {
        if (endContext.state === 'success') {
          this.spanFactory.endSpan(span, endContext.endTime, { 'http.status_code': endContext.status })
        }
      },
      // propagate trace context using network span
      extraRequestHeaders: networkRequestInfo.propagateTraceContext
        ? this.getExtraRequestHeaders(span)
        : undefined
    }
  }

  private shouldTrackRequest (startContext: RequestStartContext): boolean {
    return startContext.url !== this.configEndpoint && permittedPrefixes.some((prefix) => startContext.url.startsWith(prefix))
  }

  private getExtraRequestHeaders (spanContext = this.spanContextStorage.current): Record<string, string> {
    const extraRequestHeaders: Record<string, string> = {}

    if (spanContext) {
      extraRequestHeaders.traceparent = RemoteParentContext.toTraceParentString(spanContext)
      extraRequestHeaders.tracestate = buildTracestateHeader(spanContext.traceId)
    }

    return extraRequestHeaders
  }
}

function buildTracestateHeader (traceId: string): string {
  return `sb=v:1;r32:${traceIdToSamplingRate(traceId)}`
}
