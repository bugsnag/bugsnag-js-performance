import {
  type InternalConfiguration,
  type Logger,
  type Plugin,
  type SpanContextStorage,
  type SpanFactory,
  type SpanInternal
} from '@bugsnag/core-performance'
import {
  defaultNetworkRequestCallback,
  type NetworkRequestCallback,
  type NetworkRequestInfo,
  type RequestEndContext,
  type RequestStartCallback,
  type RequestStartContext,
  type RequestTracker
} from '@bugsnag/request-tracker-performance'
import { type ReactNativeConfiguration } from '../config'

const permittedPrefixes = ['http://', 'https://', '/', './', '../']

// The NetInfo module makes requests to this URL to detect if the device is connected to the internet - we don't want to track these
// see https://github.com/react-native-netinfo/react-native-netinfo/blob/1cd754de6c1fb102a491af418e3b6e831f58855a/src/internal/defaultConfiguration.ts#L4
const NET_INFO_REACHABILITY_URL = 'https://clients3.google.com/generate_204'

export interface ReactNativeNetworkRequestInfo extends NetworkRequestInfo {
  readonly type: 'xmlhttprequest'
}

export class NetworkRequestPlugin implements Plugin<ReactNativeConfiguration> {
  private ignoredUrls: string[] = [NET_INFO_REACHABILITY_URL]
  private tracePropagationUrls: RegExp[] = []
  private networkRequestCallback: NetworkRequestCallback<ReactNativeNetworkRequestInfo> = defaultNetworkRequestCallback
  private logger: Logger = { debug: console.debug, warn: console.warn, info: console.info, error: console.error }

  constructor (
    private spanFactory: SpanFactory<ReactNativeConfiguration>,
    private readonly spanContextStorage: SpanContextStorage,
    private xhrTracker: RequestTracker
  ) {}

  configure (configuration: InternalConfiguration<ReactNativeConfiguration>) {
    this.logger = configuration.logger

    if (configuration.autoInstrumentNetworkRequests) {
      this.ignoredUrls.push(configuration.endpoint)
      this.xhrTracker.onStart(this.trackRequest)
      this.networkRequestCallback = configuration.networkRequestCallback
      this.tracePropagationUrls = configuration.tracePropagationUrls.map(
        (url: string | RegExp): RegExp => typeof url === 'string' ? RegExp(url) : url
      )
    }
  }

  private trackRequest: RequestStartCallback = (startContext) => {
    if (!this.shouldTrackRequest(startContext)) return

    const defaultRequestInfo: ReactNativeNetworkRequestInfo = {
      url: startContext.url,
      type: 'xmlhttprequest'
    }

    const networkRequestInfo = this.networkRequestCallback(defaultRequestInfo)

    // returning null neither creates a span nor propagates trace context
    if (!networkRequestInfo) {
      return {
        onRequestEnd: undefined,
        extraRequestHeaders: undefined
      }
    }

    const propagateTraceContext = this.shouldPropagateTraceContext(startContext.url)

    // a span is not created if url is null
    if (!networkRequestInfo.url) {
      return {
        onRequestEnd: undefined,
        // propagate trace context if requested using span context
        extraRequestHeaders: propagateTraceContext ? this.getExtraRequestHeaders() : undefined
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
          // TODO: set http.status_code as part of ending a network span
          span.setAttribute('http.status_code', endContext.status)
          this.spanFactory.endSpan(span, endContext.endTime)
        }
      },
      // propagate trace context using network span
      extraRequestHeaders: propagateTraceContext
        ? this.getExtraRequestHeaders(span)
        : undefined
    }
  }

  private shouldTrackRequest (startContext: RequestStartContext): boolean {
    return !this.ignoredUrls.some(url => startContext.url.startsWith(url)) && permittedPrefixes.some((prefix) => startContext.url.startsWith(prefix))
  }

  private shouldPropagateTraceContext (url: string): boolean {
    return this.tracePropagationUrls.some(regexp => regexp.test(url))
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
