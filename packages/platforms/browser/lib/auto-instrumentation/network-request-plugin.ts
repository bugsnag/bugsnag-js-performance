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
  private tracePropagationUrls: RegExp[] = []

  constructor (
    private spanFactory: SpanFactory<BrowserConfiguration>,
    private readonly spanContextStorage: SpanContextStorage,
    private fetchTracker: RequestTracker,
    private xhrTracker: RequestTracker
  ) {}

  configure (configuration: InternalConfiguration<BrowserConfiguration>) {
    this.logger = configuration.logger
    this.tracePropagationUrls = (configuration.tracePropagationUrls ?? []).map(
      (url: string | RegExp): RegExp => typeof url === 'string' ? RegExp(url) : url
    )

    if (configuration.autoInstrumentNetworkRequests) {
      this.configEndpoint = configuration.endpoint
      this.xhrTracker.onStart(this.trackRequest)
      this.fetchTracker.onStart(this.trackRequest)
      this.networkRequestCallback = configuration.networkRequestCallback
    }
  }

  private trackRequest: RequestStartCallback = (startContext) => {
    if (!this.shouldTrackRequest(startContext)) return

    const networkRequestInfo = this.networkRequestCallback({ url: startContext.url, type: startContext.type })

    if (!networkRequestInfo) {
      return {
        onRequestEnd: undefined,
        extraRequestHeaders: this.getExtraRequestHeaders(startContext)
      }
    }

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
      extraRequestHeaders: this.getExtraRequestHeaders(
        startContext,
        span
      )
    }
  }

  private shouldTrackRequest (startContext: RequestStartContext): boolean {
    return startContext.url !== this.configEndpoint && permittedPrefixes.some((prefix) => startContext.url.startsWith(prefix))
  }

  private getExtraRequestHeaders (startContext: RequestStartContext, span?: SpanInternal): Record<string, string> {
    const extraRequestHeaders: Record<string, string> = {}

    if (this.tracePropagationUrls.some(regexp => regexp.test(startContext.url))) {
      if (span) {
        const traceId = span.traceId
        const parentSpanId = span.id
        const sampled = span.samplingRate <= this.spanFactory.sampler.spanProbability.scaled

        extraRequestHeaders.traceparent = buildTraceparentHeader(traceId, parentSpanId, sampled)
      } else if (this.spanContextStorage.current) {
        const currentSpanContext = this.spanContextStorage.current

        const traceId = currentSpanContext.traceId
        const parentSpanId = currentSpanContext.id
        const sampled = currentSpanContext.samplingRate <= this.spanFactory.sampler.spanProbability.scaled

        extraRequestHeaders.traceparent = buildTraceparentHeader(traceId, parentSpanId, sampled)
      }
    }

    return extraRequestHeaders
  }
}

function buildTraceparentHeader (traceId: string, parentSpanId: string, sampled: boolean): string {
  return `00-${traceId}-${parentSpanId}-${sampled ? '01' : '00'}`
}
