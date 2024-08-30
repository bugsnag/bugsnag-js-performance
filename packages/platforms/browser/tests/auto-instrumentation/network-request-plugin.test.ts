/**
 * @jest-environment jsdom
 */

import { DefaultSpanContextStorage, spanContextEquals } from '@bugsnag/core-performance'
import type { SpanContextStorage } from '@bugsnag/core-performance'
import { ControllableBackgroundingListener, MockSpanFactory, createConfiguration, createTestClient } from '@bugsnag/js-performance-test-utilities'
import type { BrowserSchema, BrowserConfiguration } from '../../lib/config'
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
  let fetchTracker: MockRequestTracker
  let spanFactory: MockSpanFactory<BrowserConfiguration>
  let spanContextStorage: SpanContextStorage

  beforeEach(() => {
    xhrTracker = new MockRequestTracker()
    fetchTracker = new MockRequestTracker()
    spanFactory = new MockSpanFactory()

    spanContextStorage = new DefaultSpanContextStorage(new ControllableBackgroundingListener())
  })

  it('tracks requests when autoInstrumentNetworkRequests = true', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true
    }))

    const res = fetchTracker.start({ type: 'fetch', method: 'GET', url: SAME_ORIGIN_TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })
    expect(res.extraRequestHeaders).toEqual([])

    const res2 = fetchTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 2 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })
    expect(res2.extraRequestHeaders).toEqual([])
  })

  it('starts a span on request start', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true
    }))

    const res1 = fetchTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })
    expect(res1.extraRequestHeaders).toEqual([])

    const res2 = xhrTracker.start({ type: 'xmlhttprequest', method: 'POST', url: TEST_URL, startTime: 2 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/POST]', { startTime: 2, makeCurrentContext: false })
    expect(res2.extraRequestHeaders).toEqual([])

    // traceparent headers are not added to same-origin requests by default
    const res3 = xhrTracker.start({ type: 'xmlhttprequest', method: 'POST', url: SAME_ORIGIN_TEST_URL, startTime: 2 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/POST]', { startTime: 2, makeCurrentContext: false })
    expect(res3.extraRequestHeaders).toEqual([])
  })

  it('ends a span on request end', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true
    }))

    const { onRequestEnd: endRequest } = fetchTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
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
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: false
    }))

    expect(xhrTracker.onStart).not.toHaveBeenCalled()
    expect(fetchTracker.onStart).not.toHaveBeenCalled()
  })

  it('does not track requests to the configured traces endpoint', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)

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
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)

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
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true
    }))

    fetchTracker.start({ type: 'fetch', method: 'GET', url, startTime: 1 })
    expect(spanFactory.startSpan).not.toHaveBeenCalled()
  })

  it('discards the span if the status is 0', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true
    }))

    const { onRequestEnd: endRequest } = xhrTracker.start({ type: 'xmlhttprequest', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })

    endRequest({ endTime: 2, state: 'error' })
    expect(spanFactory.endSpan).not.toHaveBeenCalled()
  })

  it('discards the span if there is an error', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)

    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true
    }))

    const { onRequestEnd: endRequest } = fetchTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })

    endRequest({ state: 'error', error: new Error('woopsy'), endTime: 2 })
    expect(spanFactory.endSpan).not.toHaveBeenCalled()
  })

  it('does not push network spans to the context stack', () => {
    const client = createTestClient<BrowserSchema, BrowserConfiguration>({
      plugins: (spanFactory, spanContextStorage) => [
        new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)
      ]
    })
    const rootSpan = client.startSpan('root span')

    fetchTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
    xhrTracker.start({ type: 'fetch', method: 'POST', url: TEST_URL, startTime: 2 })

    expect(spanContextEquals(rootSpan, client.currentSpanContext)).toBe(true)
  })

  it('prevents creating a span when networkRequestCallback returns null', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)
    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true,
      networkRequestCallback: (networkRequestInfo) => networkRequestInfo.url === 'no-delivery' ? null : networkRequestInfo
    }))

    fetchTracker.start({ type: 'fetch', method: 'GET', url: 'no-delivery', startTime: 1 })
    expect(spanFactory.startSpan).not.toHaveBeenCalled()

    fetchTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })
  })

  it('prevents creating a span when networkRequestCallback returns { url: null }', () => {
    // if { url: null } is returned from the networkRequestCallback, a span is not created
    // and trace propagation headers are not added if there is no span context as well
    spanContextStorage.push({
      id: 'abc123',
      traceId: 'xyz456',
      samplingRate: 0.1,
      isValid: () => true
    })

    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)
    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true,
      networkRequestCallback: (networkRequestInfo) => ({ ...networkRequestInfo, url: null })
    }))

    const res = fetchTracker.start({ type: 'fetch', method: 'GET', url: SAME_ORIGIN_TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).not.toHaveBeenCalled()
    expect(res.extraRequestHeaders).toEqual([])
  })

  it('prevents adding trace propagation headers when networkRequestCallback returns { propagateTraceContext: false }', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)
    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true,
      networkRequestCallback: (networkRequestInfo) => ({ ...networkRequestInfo, propagateTraceContext: false })
    }))

    const res = fetchTracker.start({ type: 'fetch', method: 'GET', url: SAME_ORIGIN_TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })
    expect(res.extraRequestHeaders).toEqual([])
  })

  it('adds trace propagation headers when networkRequestCallback returns { propagateTraceContext: true }', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)
    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true,
      networkRequestCallback: (networkRequestInfo) => ({ ...networkRequestInfo, propagateTraceContext: true })
    }))

    // by default when the origin is different trace propagation headers are not added, unless the networkRequestCallback returns { propagateTraceContext: true }
    const res = fetchTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP/GET]', { startTime: 1, makeCurrentContext: false })
    expect(res.extraRequestHeaders).toEqual([
      {
        traceparent: '00-a random 128 bit string-a random 64 bit string-01',
        tracestate: 'sb=v:1;r32:290'
      }
    ])
  })

  it('uses a modified url from networkRequestCallback', () => {
    const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)
    plugin.configure(createConfiguration<BrowserConfiguration>({
      endpoint: ENDPOINT,
      autoInstrumentNetworkRequests: true,
      networkRequestCallback: (networkRequestInfo) => ({
        type: networkRequestInfo.type,
        url: 'modified-url'
      })
    }))

    const { onRequestEnd: endRequest } = fetchTracker.start({ type: 'fetch', method: 'GET', url: TEST_URL, startTime: 1 })
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

  describe('generating trace propagation extraRequestHeaders', () => {
    describe('when a network span is being created for the request', () => {
      it('generates a trace propagation extraRequestHeader if propagateTraceContext is set to true', () => {
        spanContextStorage.push({
          id: 'abc123',
          traceId: 'xyz456',
          samplingRate: 0.1,
          isValid: () => true
        })
        const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)

        plugin.configure(createConfiguration<BrowserConfiguration>({
          endpoint: ENDPOINT,
          autoInstrumentNetworkRequests: true,
          networkRequestCallback: (requestInfo) => {
            requestInfo.propagateTraceContext = true
            return requestInfo
          }
        }))

        const res = fetchTracker.start({ type: 'fetch', method: 'GET', url: 'https://my-api.com/users', startTime: 1 })

        expect(res.extraRequestHeaders).toEqual([
          {
            traceparent: '00-a random 128 bit string-a random 64 bit string-01',
            tracestate: 'sb=v:1;r32:290'
          }
        ])

        const res2 = fetchTracker.start({ type: 'fetch', method: 'GET', url: '/users', startTime: 1 })

        expect(res2.extraRequestHeaders).toEqual([
          {
            traceparent: '00-a random 128 bit string-a random 64 bit string-01',
            tracestate: 'sb=v:1;r32:290'

          }
        ])
      })

      it('does not generate trace propagation extraRequestHeader if propagateTraceContext is set to false', () => {
        spanContextStorage.push({
          id: 'abc123',
          traceId: 'xyz456',
          samplingRate: 0.1,
          isValid: () => true
        })
        const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)

        plugin.configure(createConfiguration<BrowserConfiguration>({
          endpoint: ENDPOINT,
          autoInstrumentNetworkRequests: true,
          networkRequestCallback: (requestInfo) => {
            requestInfo.propagateTraceContext = false
            return requestInfo
          }
        }))

        const res = fetchTracker.start({ type: 'fetch', method: 'GET', url: 'https://not-my-api.com/users', startTime: 1 })

        expect(res.extraRequestHeaders).toEqual([])
      })
    })

    describe('when a network span is not being created for the request', () => {
      it('uses the span context', () => {
        spanContextStorage.push({
          id: 'abc123',
          traceId: 'xyz456',
          samplingRate: 0.1,
          isValid: () => true
        })
        const plugin = new NetworkRequestPlugin(spanFactory, spanContextStorage, fetchTracker, xhrTracker)

        plugin.configure(createConfiguration<BrowserConfiguration>({
          endpoint: ENDPOINT,
          autoInstrumentNetworkRequests: true,
          networkRequestCallback: (requestInfo) => {
            requestInfo.propagateTraceContext = true
            requestInfo.url = null
            return requestInfo
          }
        }))

        const res = fetchTracker.start({ type: 'fetch', method: 'GET', url: 'https://my-api.com/users', startTime: 1 })

        expect(res.extraRequestHeaders).toEqual([
          {
            traceparent: '00-xyz456-abc123-01',
            tracestate: 'sb=v:1;r32:0'
          }
        ])
      })
    })
  })
})
