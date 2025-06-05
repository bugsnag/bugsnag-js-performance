import { RemoteParentContext } from '@bugsnag/core-performance'
import type { Logger, Plugin, PluginContext, SpanContextStorage, SpanFactory } from '@bugsnag/core-performance'
import type {
  NetworkRequestCallback,
  NetworkRequestInfo,
  RequestEndContext,
  RequestStartCallback,
  RequestStartContext,
  RequestTracker
} from '@bugsnag/request-tracker-performance'
import { defaultNetworkRequestCallback } from '@bugsnag/request-tracker-performance'
import type { ReactNativeConfiguration } from '../config'

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
  private enabled: boolean = false

  constructor (
    private spanFactory: SpanFactory<ReactNativeConfiguration>,
    private readonly spanContextStorage: SpanContextStorage,
    private xhrTracker: RequestTracker
  ) {}

  install (context: PluginContext<ReactNativeConfiguration>) {
    this.logger = context.configuration.logger

    if (context.configuration.autoInstrumentNetworkRequests) {
      this.enabled = true
      this.ignoredUrls.push(context.configuration.endpoint)
      this.networkRequestCallback = context.configuration.networkRequestCallback
      this.tracePropagationUrls = context.configuration.tracePropagationUrls.map(
        (url: string | RegExp): RegExp => typeof url === 'string' ? RegExp(url) : url
      )
    }
  }

  start () {
    if (this.enabled) {
      this.xhrTracker.onStart(this.trackRequest)
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
          this.spanFactory.endSpan(span, endContext.endTime, { 'http.status_code': endContext.status })
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

  private getExtraRequestHeaders (spanContext = this.spanContextStorage.current): Record<string, string> {
    const extraRequestHeaders: Record<string, string> = {}
    if (spanContext) {
      extraRequestHeaders.traceparent = RemoteParentContext.toTraceParentString(spanContext)
    }

    return extraRequestHeaders
  }
}
