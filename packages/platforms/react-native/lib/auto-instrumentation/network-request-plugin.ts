import {
  type InternalConfiguration,
  type Logger,
  type Plugin,
  type SpanFactory
} from '@bugsnag/core-performance'
import {
  defaultNetworkRequestCallback,
  type RequestStartCallback,
  type NetworkRequestCallback,
  type NetworkRequestInfo,
  type RequestEndContext,
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
  private networkRequestCallback: NetworkRequestCallback<ReactNativeNetworkRequestInfo> = defaultNetworkRequestCallback
  private logger: Logger = { debug: console.debug, warn: console.warn, info: console.info, error: console.error }

  constructor (
    private spanFactory: SpanFactory<ReactNativeConfiguration>,
    private xhrTracker: RequestTracker
  ) {}

  configure (configuration: InternalConfiguration<ReactNativeConfiguration>) {
    this.logger = configuration.logger

    if (configuration.autoInstrumentNetworkRequests) {
      this.ignoredUrls.push(configuration.endpoint)
      this.xhrTracker.onStart(this.trackRequest)
      this.networkRequestCallback = configuration.networkRequestCallback
    }
  }

  private trackRequest: RequestStartCallback = (startContext) => {
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

    return {
      onRequestEnd: (endContext: RequestEndContext) => {
        if (endContext.state === 'success') {
          span.setAttribute('http.status_code', endContext.status)
          this.spanFactory.endSpan(span, endContext.endTime)
        }
      }
    }
  }

  private shouldTrackRequest (startContext: RequestStartContext): boolean {
    return !this.ignoredUrls.some(url => startContext.url.startsWith(url)) && permittedPrefixes.some((prefix) => startContext.url.startsWith(prefix))
  }
}
