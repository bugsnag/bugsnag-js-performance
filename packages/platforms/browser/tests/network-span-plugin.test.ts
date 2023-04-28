import NetworkSpanPlugin from '../lib/network-span-plugin'
import { SpanFactory, type SpanEnded, type SpanInternal } from '@bugsnag/js-performance-core'
import { StableIdGenerator, spanAttributesSource } from '@bugsnag/js-performance-test-utilities'
import { RequestTracker, type RequestStartCallback } from '../lib/request-tracker/request-tracker'

const ENDPOINT = 'http://traces.endpoint'
const TEST_URL = 'http://test-url.com/'

class MockRequestTracker extends RequestTracker {
  onStart = jest.fn((startCallback: RequestStartCallback) => {
    super.onStart(startCallback)
  })
}

class MockSpanFactory extends SpanFactory {
  createdSpans: SpanInternal[] = []

  constructor () {
    const delivery = { send: jest.fn() }
    const processor = { add: (span: SpanEnded) => delivery.send(span) }
    const sampler: any = { probability: 0.1, sample: () => true }
    super(processor, sampler, new StableIdGenerator(), spanAttributesSource)
  }

  startSpan = jest.fn((name: string, startTime: number) => {
    const span = super.startSpan(name, startTime)
    this.createdSpans.push(span)
    return span
  })

  endSpan = jest.fn((span: SpanInternal, endTime: number) => {
    super.endSpan(span, endTime)
  })
}

describe('network span plugin', () => {
  let xhrTracker: MockRequestTracker
  let fetchTracker: MockRequestTracker
  let spanFactory: MockSpanFactory

  beforeEach(() => {
    xhrTracker = new MockRequestTracker()
    fetchTracker = new MockRequestTracker()
    spanFactory = new MockSpanFactory()
  })

  it('tracks requests when autoInstrumentNetworkRequests = true', () => {
    const plugin = new NetworkSpanPlugin(spanFactory, fetchTracker, xhrTracker)
    expect(xhrTracker.onStart).not.toHaveBeenCalled()
    expect(fetchTracker.onStart).not.toHaveBeenCalled()

    // @ts-expect-error configuration
    plugin.configure({ endpoint: ENDPOINT, autoInstrumentNetworkRequests: true })
    expect(xhrTracker.onStart).toHaveBeenCalled()
    expect(fetchTracker.onStart).toHaveBeenCalled()
  })

  it('starts a span on request start', () => {
    const plugin = new NetworkSpanPlugin(spanFactory, fetchTracker, xhrTracker)

    // @ts-expect-error configuration
    plugin.configure({ endpoint: ENDPOINT, autoInstrumentNetworkRequests: true })

    fetchTracker.start({ method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP]/GET', 1)

    xhrTracker.start({ method: 'POST', url: TEST_URL, startTime: 2 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP]/POST', 2)
  })

  it('ends a span on request end', () => {
    const plugin = new NetworkSpanPlugin(spanFactory, fetchTracker, xhrTracker)

    // @ts-expect-error configuration
    plugin.configure({ endpoint: ENDPOINT, autoInstrumentNetworkRequests: true })

    const endRequest = fetchTracker.start({ method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP]/GET', 1)

    expect(spanFactory.endSpan).not.toHaveBeenCalled()
    endRequest({ status: 200, endTime: 2 })
    expect(spanFactory.endSpan).toHaveBeenCalledWith(spanFactory.createdSpans[0], 2)
  })

  it('does not track requests when autoInstrumentNetworkRequests = false', () => {
    const plugin = new NetworkSpanPlugin(spanFactory, fetchTracker, xhrTracker)

    // @ts-expect-error configuration
    plugin.configure({ endpoint: ENDPOINT, autoInstrumentNetworkRequests: false })
    expect(xhrTracker.onStart).not.toHaveBeenCalled()
    expect(fetchTracker.onStart).not.toHaveBeenCalled()
  })

  it('does not track requests to the configured traces endpoint', () => {
    const plugin = new NetworkSpanPlugin(spanFactory, fetchTracker, xhrTracker)

    // @ts-expect-error configuration
    plugin.configure({ endpoint: ENDPOINT, autoInstrumentNetworkRequests: true })

    fetchTracker.start({ method: 'GET', url: `${ENDPOINT}/traces`, startTime: 1 })
    expect(spanFactory.startSpan).not.toHaveBeenCalled()
  })

  it('discards the span if the status is 0', () => {
    const plugin = new NetworkSpanPlugin(spanFactory, fetchTracker, xhrTracker)

    // @ts-expect-error configuration
    plugin.configure({ endpoint: ENDPOINT, autoInstrumentNetworkRequests: true })

    const endRequest = xhrTracker.start({ method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP]/GET', 1)

    endRequest({ status: 0, endTime: 2 })
    expect(spanFactory.endSpan).not.toHaveBeenCalled()
  })

  it('discards the span if there is an error', () => {
    const plugin = new NetworkSpanPlugin(spanFactory, fetchTracker, xhrTracker)

    // @ts-expect-error configuration
    plugin.configure({ endpoint: ENDPOINT, autoInstrumentNetworkRequests: true })

    const endRequest = fetchTracker.start({ method: 'GET', url: TEST_URL, startTime: 1 })
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[HTTP]/GET', 1)

    endRequest({ error: new Error('woopsy'), endTime: 2 })
    expect(spanFactory.endSpan).not.toHaveBeenCalled()
  })
})
