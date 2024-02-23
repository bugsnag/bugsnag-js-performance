import { spanContextEquals } from '@bugsnag/core-performance'
import { MockSpanFactory, createConfiguration, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { type BrowserSchema, type BrowserConfiguration } from '../../lib/config'
import { RequestTracker, type RequestStartCallback } from '@bugsnag/request-tracker-performance'
import { NetworkRequestPlugin } from '../../lib/auto-instrumentation/network-request-plugin'

const ENDPOINT = 'http://traces.endpoint'
const TEST_URL = 'http://test-url.com/'

class MockRequestTracker extends RequestTracker {
  onStart = jest.fn((startCallback: RequestStartCallback) => {
    super.onStart(startCallback)
  })
}

describe('network span plugin', () => {
  let xhrTracker: MockRequestTracker
  let fetchTracker: MockRequestTracker
  let spanFactory: MockSpanFactory<BrowserConfiguration>

  beforeEach(() => {
    xhrTracker = new MockRequestTracker()
    fetchTracker = new MockRequestTracker()
    spanFactory = new MockSpanFactory()
  })

  it('tracks requests when autoInstrumentNetworkRequests = true', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, fetchTracker, xhrTracker)
    expect(xhrTracker.onStart).not.toHaveBeenCalled()
    expect(fetchTracker.onStart).not.toHaveBeenCalled()

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true
    }))

    expect(xhrTracker.onStart).toHaveBeenCalled()
    expect(fetchTracker.onStart).toHaveBeenCalled()
  })

  it('starts a span on request start', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true
    }))

    fetchTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP]/GET', { startTime: 1, makeCurrentContext: false })

    xhrTracker.start({ type: 'xmlhttprequest', method: 'POST', url: TEST_URL, startTime: 2 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP]/POST', { startTime: 2, makeCurrentContext: false })
  })

  it('ends a span on request end', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true
    }))

    const { onRequestEnd: endRequest } = fetchTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP]/GET', { startTime: 1, makeCurrentContext: false })
    expect(spanFactory.endSpan).not.toHaveBeenCalled()

    endRequest({ status: 200, endTime: 2, state: 'success' })
    expect(spanFactory.endSpan).toHaveBeenCalled()
    expect(spanFactory.createdSpans.length).toEqual(1)

    const span = spanFactory.createdSpans[0]
    expect(span.name).toEqual('[HTTP]/GET')
    expect(span.startTime).toEqual(1)
    expect(span.endTime).toEqual(2)
    expect(span).toHaveAttribute('bugsnag.span.category', 'network')
    expect(span).toHaveAttribute('http.url', TEST_URL)
    expect(span).toHaveAttribute('http.method', 'GET')
    expect(span).toHaveAttribute('http.status_code', 200)
  })

  it('does not track requests when autoInstrumentNetworkRequests = false', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: false
    }))

    expect(xhrTracker.onStart).not.toHaveBeenCalled()
    expect(fetchTracker.onStart).not.toHaveBeenCalled()
  })

  it('does not track requests to the configured traces endpoint', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true
    }))

    fetchTracker.start({ type: 'fetch', method: 'GET', url: `${ENDPOINT}`, startTime: 1 })
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
    const plugin = new NetworkRequestPlugin(spanFactory, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true
    }))

    fetchTracker.start({ type: 'fetch', method: 'GET', url, startTime: 1 })
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
    const plugin = new NetworkRequestPlugin(spanFactory, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true
    }))

    fetchTracker.start({ type: 'fetch', method: 'GET', url, startTime: 1 })
    expect(spanFactory.startSpan).not.toHaveBeenCalled()
  })

  it('discards the span if the status is 0', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true
    }))

    const { onRequestEnd: endRequest } = xhrTracker.start({ type: 'xmlhttprequest', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP]/GET', { startTime: 1, makeCurrentContext: false })

    endRequest({ endTime: 2, state: 'error' })
    expect(spanFactory.endSpan).not.toHaveBeenCalled()
  })

  it('discards the span if there is an error', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true
    }))

    const { onRequestEnd: endRequest } = fetchTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP]/GET', { startTime: 1, makeCurrentContext: false })

    endRequest({ state: 'error', error: new Error('woopsy'), endTime: 2 })
    expect(spanFactory.endSpan).not.toHaveBeenCalled()
  })

  it('does not push network spans to the context stack', () => {
    const client = createTestClient<BrowserSchema, BrowserConfiguration>({ plugins: (spanFactory) => [new NetworkRequestPlugin(spanFactory, fetchTracker, xhrTracker)] })
    const rootSpan = client.startSpan('root span')

    fetchTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
    xhrTracker.start({ type: 'fetch', method: 'POST', url: TEST_URL, startTime: 2 })

    expect(spanContextEquals(rootSpan, client.currentSpanContext)).toBe(true)
  })

  it('prevents creating a span when networkRequestCallback returns null', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, fetchTracker, xhrTracker)
    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true,
      networkRequestCallback: (networkRequestInfo) => networkRequestInfo.url === 'no-delivery' ? null : networkRequestInfo
    }))

    fetchTracker.start({ type: 'fetch', method: 'GET', url: 'no-delivery', startTime: 1 })
    expect(spanFactory.startSpan).not.toHaveBeenCalled()

    fetchTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP]/GET', { startTime: 1, makeCurrentContext: false })
  })

  it('uses a modified url from networkRequestCallback', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, fetchTracker, xhrTracker)
    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true,
      networkRequestCallback: (networkRequestInfo) => ({
        type: networkRequestInfo.type,
        url: 'modified-url'
      })
    }))

    const { onRequestEnd: endRequest } = fetchTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP]/GET', { startTime: 1, makeCurrentContext: false })

    endRequest({ status: 200, endTime: 2, state: 'success' })
    expect(spanFactory.endSpan).toHaveBeenCalled()
    expect(spanFactory.createdSpans.length).toEqual(1)

    const span = spanFactory.createdSpans[0]
    expect(span.name).toEqual('[HTTP]/GET')
    expect(span.startTime).toEqual(1)
    expect(span.endTime).toEqual(2)
    expect(span).toHaveAttribute('bugsnag.span.category', 'network')
    expect(span).toHaveAttribute('http.url', 'modified-url')
    expect(span).toHaveAttribute('http.method', 'GET')
    expect(span).toHaveAttribute('http.status_code', 200)
  })
})
