import { DefaultSpanContextStorage, PluginContext, spanContextEquals } from '@bugsnag/core-performance'
import type { SpanContextStorage } from '@bugsnag/core-performance'
import { ControllableBackgroundingListener, MockSpanFactory, createConfiguration, createTestClient } from '@bugsnag/js-performance-test-utilities'
import type { ReactNativeSchema, ReactNativeConfiguration } from '../../lib/config'
import { RequestTracker } from '@bugsnag/request-tracker-performance'
import type { RequestStartCallback } from '@bugsnag/request-tracker-performance'
import { NetworkRequestPlugin } from '../../lib/auto-instrumentation/network-request-plugin'

const ENDPOINT = 'http://traces.endpoint'
const TEST_URL = 'http://test-url.com/'
const SAME_ORIGIN_TEST_URL = 'http://localhost/my-api'

class MockRequestTracker extends RequestTracker {
  onStart = jest.fn((startCallback: RequestStartCallback) => {
    super.onStart(startCallback)
  })
}

describe('network span plugin', () => {
  let xhrTracker: MockRequestTracker
  let spanFactory: MockSpanFactory<ReactNativeConfiguration>
  let spanContextStorage: SpanContextStorage

  const createContext = (overrides: Partial<ReactNativeConfiguration> = {}) => {
    // @ts-expect-error clock is protected
    const clock = spanFactory.clock
  return new PluginContext(createConfiguration<ReactNativeConfiguration>({
    endpoint: ENDPOINT,
    autoInstrumentNetworkRequests: true,
    tracePropagationUrls: [],
    ...overrides
  }), clock)
}

  beforeEach(() => {
    xhrTracker = new MockRequestTracker()
    spanFactory = new MockSpanFactory()
    spanContextStorage = new DefaultSpanContextStorage(new ControllableBackgroundingListener())
  })

  it('tracks requests when autoInstrumentNetworkRequests = true', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)
    expect(xhrTracker.onStart).not.toHaveBeenCalled()

    plugin.install(createContext())
    plugin.start()

    expect(xhrTracker.onStart).toHaveBeenCalled()
  })

  it('starts a span on request start', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)

    plugin.install(createContext())
    plugin.start()

    const res = xhrTracker.start({ type: 'xmlhttprequest', method: 'POST', url: TEST_URL, startTime: 2 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/POST]', { startTime: 2, makeCurrentContext: false })
    expect(res.extraRequestHeaders).toEqual([])

    // currently traceparent headers are not added to any requests by default
    const res2 = xhrTracker.start({ type: 'xmlhttprequest', method: 'POST', url: SAME_ORIGIN_TEST_URL, startTime: 2 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/POST]', { startTime: 2, makeCurrentContext: false })
    expect(res2.extraRequestHeaders).toEqual([])
  })

  it('ends a span on request end', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)

    plugin.install(createContext())
    plugin.start()

    const { onRequestEnd: endRequest } = xhrTracker.start({ type: 'xmlhttprequest', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })
    expect(spanFactory.endSpan).not.toHaveBeenCalled()

    endRequest({ status: 200, endTime: 2, state: 'success' })
    expect(spanFactory.endSpan).toHaveBeenCalled()
    expect(spanFactory.createdSpans.length).toEqual(1)

    const span = spanFactory.createdSpans[0]
    expect(span.name).toEqual('[HTTP/GET]')
    expect(span.startTime).toEqual(1)
    expect(span.endTime).toEqual(2)
    expect(span).toHaveAttribute('bugsnag.span.category', 'network')
    expect(span).toHaveAttribute('http.url', TEST_URL)
    expect(span).toHaveAttribute('http.method', 'GET')
    expect(span).toHaveAttribute('http.status_code', 200)
  })

  it('does not track requests when autoInstrumentNetworkRequests = false', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)

    plugin.install(createContext({ autoInstrumentNetworkRequests: false }))
    plugin.start()

    expect(xhrTracker.onStart).not.toHaveBeenCalled()
  })

  it('does not track requests to the configured traces endpoint', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)

    plugin.install(createContext())
    plugin.start()

    xhrTracker.start({ type: 'xmlhttprequest', method: 'GET', url: `${ENDPOINT}`, startTime: 1 })
    expect(spanFactory.startSpan).not.toHaveBeenCalled()
  })

  it('does not track requests to the NetInfo reachability URL', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)
    const NET_INFO_REACHABILITY_URL = 'https://clients3.google.com/generate_204?_=1701691583660'

    plugin.install(createContext())
    plugin.start()

    xhrTracker.start({ type: 'xmlhttprequest', method: 'GET', url: NET_INFO_REACHABILITY_URL, startTime: 1 })
    expect(spanFactory.startSpan).not.toHaveBeenCalled()
  })

  const expectedProtocols = [
    'http://bugsnag.com/image.jpg',
    'https://bugsnag.com/image.jpg',
    '/bugsnag.jpg',
    './bugsnag.jpg',
    '../bugsnag.jpg',
    '../../images/bugsnag.jpg'
  ]

  it.each(expectedProtocols)('tracks requests over all expected protocols', (url) => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)

    plugin.install(createContext())
    plugin.start()

    xhrTracker.start({ type: 'xmlhttprequest', method: 'GET', url, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalled()
  })

  const unexpectedProtocols = [
    'chrome://<settings>/<path>/[<specificSetting>]',
    'chrome-extension://<extensionID>/<pageName>.html',
    'properties://browser/clickID',
    'zoommtg://zoom.us/join?confno=1234',
    'slack://open?team=1234',
    'javascript:<javascript to execute>',
    'ws:websocket-address',
    'spotify:search:bugsnag',
    'session:help@root-level.store'
  ]

  it.each(unexpectedProtocols)('does not track requests over unexpected protocols', (url) => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)

    plugin.install(createContext())
    plugin.start()

    xhrTracker.start({ type: 'xmlhttprequest', method: 'GET', url, startTime: 1 })
    expect(spanFactory.startSpan).not.toHaveBeenCalled()
  })

  it('discards the span if the status is 0', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)

    plugin.install(createContext())
    plugin.start()

    const { onRequestEnd: endRequest } = xhrTracker.start({ type: 'xmlhttprequest', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })

    endRequest({ endTime: 2, state: 'error' })
    expect(spanFactory.endSpan).not.toHaveBeenCalled()
  })

  it('discards the span if there is an error', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)

    plugin.install(createContext())
    plugin.start()

    const { onRequestEnd: endRequest } = xhrTracker.start({ type: 'xmlhttprequest', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })

    endRequest({ state: 'error', error: new Error('woopsy'), endTime: 2 })
    expect(spanFactory.endSpan).not.toHaveBeenCalled()
  })

  it('does not push network spans to the context stack', () => {
    const client = createTestClient<ReactNativeSchema, ReactNativeConfiguration>(
      { plugins: (spanFactory, spanContextStorage) => [new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)] }
    )
    const rootSpan = client.startSpan('root span')

    xhrTracker.start({ type: 'xmlhttprequest', method: 'POST', url: TEST_URL, startTime: 2 })

    expect(spanContextEquals(rootSpan, client.currentSpanContext)).toBe(true)
  })

  it('prevents creating a span when networkRequestCallback returns null', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)
    plugin.install(createContext({
      networkRequestCallback: (networkRequestInfo) => networkRequestInfo.url === 'no-delivery' ? null : networkRequestInfo
    }))
    plugin.start()

    xhrTracker.start({ type: 'xmlhttprequest', method: 'GET', url: 'no-delivery', startTime: 1 })
    expect(spanFactory.startSpan).not.toHaveBeenCalled()

    xhrTracker.start({ type: 'xmlhttprequest', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })
  })

  it('uses a modified url from networkRequestCallback', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)
    plugin.install(createContext({
      networkRequestCallback: (networkRequestInfo) => ({
        type: networkRequestInfo.type,
        url: 'modified-url'
      })
    }))
    plugin.start()

    const { onRequestEnd: endRequest } = xhrTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })

    endRequest({ status: 200, endTime: 2, state: 'success' })
    expect(spanFactory.endSpan).toHaveBeenCalled()
    expect(spanFactory.createdSpans.length).toEqual(1)

    const span = spanFactory.createdSpans[0]
    expect(span.name).toEqual('[HTTP/GET]')
    expect(span.startTime).toEqual(1)
    expect(span.endTime).toEqual(2)
    expect(span).toHaveAttribute('bugsnag.span.category', 'network')
    expect(span).toHaveAttribute('http.url', 'modified-url')
    expect(span).toHaveAttribute('http.method', 'GET')
    expect(span).toHaveAttribute('http.status_code', 200)
  })

  it('adds trace propagation headers when url matches tracePropagationUrls (string)', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)
    plugin.install(createContext({
      tracePropagationUrls: [TEST_URL]
    }))
    plugin.start()

    const res = xhrTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })
    expect(res.extraRequestHeaders).toEqual([
      { traceparent: '00-a random 128 bit string-a random 64 bit string-01' }
    ])
  })

  it('adds trace propagation headers when url matches tracePropagationUrls (RegExp)', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)
    plugin.install(createContext({
      tracePropagationUrls: [
        /^(http(s)?(:\/\/))?(www\.)?test-url\.com(\/.*)?$/
      ]
    }))
    plugin.start()

    const res = xhrTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })
    expect(res.extraRequestHeaders).toEqual([
      { traceparent: '00-a random 128 bit string-a random 64 bit string-01' }
    ])
  })

  it('does not add trace propagation headers when tracePropagationUrls is empty', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)
    plugin.install(createContext())
    plugin.start()

    const res = xhrTracker.start({ type: 'fetch', method: 'GET', url: SAME_ORIGIN_TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })
    expect(res.extraRequestHeaders).toEqual([])
  })

  it('does not add trace propagation headers when url does not match tracePropagationUrls', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrTracker)
    plugin.install(createContext({
      tracePropagationUrls: [
        'http://noheader.com/',
        /^(http(s)?(:\/\/))?(www\.)?noheader\.com(\/.*)?$/
      ]
    }))
    plugin.start()

    const res = xhrTracker.start({ type: 'fetch', method: 'GET', url: SAME_ORIGIN_TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })
    expect(res.extraRequestHeaders).toEqual([])
  })
})
