import type { SpanInternal, InternalConfiguration, Logger, Plugin, SpanFactory, SpanContextStorage } from '@bugsnag/core-performance'
import {
  defaultNetworkRequestCallback,
  type RequestStartCallback,
  type NetworkRequestCallback,
  type NetworkRequestInfo,
  type RequestEndContext,
  type RequestStartContext,
  type RequestTracker
} from '@bugsnag/request-tracker-performance'
import { type BrowserConfiguration } from '../config'

export interface BrowserNetworkRequestInfo extends NetworkRequestInfo {
  readonly type: PerformanceResourceTiming['initiatorType']
}

const permittedPrefixes = ['http://', 'https://', '/', './', '../']

export class NetworkRequestPlugin implements Plugin<BrowserConfiguration> {
  private configEndpoint: string = ''
  private networkRequestCallback: NetworkRequestCallback<BrowserNetworkRequestInfo> = defaultNetworkRequestCallback
  private logger: Logger = { debug: console.debug, warn: console.warn, info: console.info, error: console.error }

  constructor (
    private spanFactory: SpanFactory<BrowserConfiguration>,
    private readonly spanContextStorage: SpanContextStorage,
    private fetchTracker: RequestTracker,
    private xhrTracker: RequestTracker
  ) {}

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    this.logger = configuration.logger

    if (configuration.autoInstrumentNetworkRequests) {
      this.configEndpoint = configuration.endpoint
      this.xhrTracker.onStart(this.trackRequest)
      this.fetchTracker.onStart(this.trackRequest)
      this.networkRequestCallback = configuration.networkRequestCallback
    }
  }

  private trackRequest: RequestStartCallback = (startContext) => {
    if (!this.shouldTrackRequest(startContext)) return

    const shouldPropagateTraceContextByDefault = startContext.url.startsWith(window.origin)

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

    const span = this.spanFactory.startSpan(
      `[HTTP]/${startContext.method.toUpperCase()}`,
      { startTime: startContext.startTime, makeCurrentContext: false }
    )

    span.setAttribute('bugsnag.span.category', 'network')
    span.setAttribute('http.method', startContext.method)
    span.setAttribute('http.url', networkRequestInfo.url)

    return {
      onRequestEnd: (endContext: RequestEndContext) => {
        if (endContext.state === 'success') {
          span.setAttribute('http.status_code', endContext.status)
          this.spanFactory.endSpan(span, endContext.endTime)
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

  private getExtraRequestHeaders (span?: SpanInternal): Record<string, string> {
    const extraRequestHeaders: Record<string, string> = {}

    if (span) {
      const traceId = span.traceId
      const parentSpanId = span.id
      const sampled = this.spanFactory.sampler.shouldSample(span.samplingRate)

      extraRequestHeaders.traceparent = buildTraceparentHeader(traceId, parentSpanId, sampled)
    } else if (this.spanContextStorage.current) {
      const currentSpanContext = this.spanContextStorage.current

      const traceId = currentSpanContext.traceId
      const parentSpanId = currentSpanContext.id
      const sampled = this.spanFactory.sampler.shouldSample(currentSpanContext.samplingRate)

      extraRequestHeaders.traceparent = buildTraceparentHeader(traceId, parentSpanId, sampled)
    }

    return extraRequestHeaders
  }
}

function buildTraceparentHeader (traceId: string, parentSpanId: string, sampled: boolean): string {
  return `00-${traceId}-${parentSpanId}-${sampled ? '01' : '00'}`
}
