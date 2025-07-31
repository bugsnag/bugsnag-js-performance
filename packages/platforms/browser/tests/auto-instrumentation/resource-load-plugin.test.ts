/**
 * @jest-environment jsdom
 */

import { InMemoryDelivery, IncrementingClock, IncrementingIdGenerator, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { ResourceLoadPlugin } from '../../lib/auto-instrumentation/resource-load-plugin'
import { createSchema } from '../../lib/config'
import type { BrowserConfiguration, BrowserSchema } from '../../lib/config'
import { createDefaultRoutingProvider } from '../../lib/default-routing-provider'
import createOnSettle from '../../lib/on-settle'
import { RequestTracker } from '@bugsnag/request-tracker-performance'
import { PerformanceFake, PerformanceObserverManager } from '../utilities'
import { createPerformanceResourceNavigationTimingFake } from '../utilities/performance-entry'

jest.useFakeTimers()

const performance = new PerformanceFake()
const fetchRequestTracker = new RequestTracker()
const xhrRequestTracker = new RequestTracker()

const onSettle = createOnSettle(new IncrementingClock(), window, fetchRequestTracker, xhrRequestTracker, performance)
const DefaultRoutingProvider = createDefaultRoutingProvider(onSettle, window.location)
const schema = createSchema(new DefaultRoutingProvider())

describe('ResourceLoadPlugin', () => {
  it('automatically creates a ResourceLoad span for a custom span', async () => {
    const delivery = new InMemoryDelivery()
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const idGenerator = new IncrementingIdGenerator()

    const client = createTestClient<BrowserSchema, BrowserConfiguration>({
      schema,
      idGenerator,
      deliveryFactory: () => delivery,
      plugins: (spanFactory, spanContextStorage) => [
        new ResourceLoadPlugin(spanFactory, spanContextStorage, Observer)
      ]
    })

    client.start({ apiKey: VALID_API_KEY })

    const span = client.startSpan('custom-span')
    const span2 = client.startSpan('custom-span-2')

    manager.queueEntry(createPerformanceResourceNavigationTimingFake({ name: 'https://bugsnag.com/image.jpg' }))
    manager.flushQueue()

    span.end()
    span2.end()

    await jest.runOnlyPendingTimersAsync()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: 'custom-span',
      spanId: 'span ID 1',
      parentSpanId: undefined,
      traceId: 'trace ID 1'
    }))

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: 'custom-span-2',
      spanId: 'span ID 2',
      parentSpanId: 'span ID 1',
      traceId: 'trace ID 1'
    }))

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[ResourceLoad]https://bugsnag.com/image.jpg',
      spanId: 'span ID 3',
      parentSpanId: 'span ID 1',
      traceId: 'trace ID 1'
    }))
  })

  it('does not create a ResourceLoad span for fetch/xhr resources', async () => {
    const delivery = new InMemoryDelivery()
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const idGenerator = new IncrementingIdGenerator()

    const client = createTestClient<BrowserSchema, BrowserConfiguration>({
      schema,
      idGenerator,
      deliveryFactory: () => delivery,
      plugins: (spanFactory, spanContextStorage) => [
        new ResourceLoadPlugin(spanFactory, spanContextStorage, Observer)
      ]
    })

    client.start({ apiKey: VALID_API_KEY })

    const span = client.startSpan('custom-span', { makeCurrentContext: false })

    manager.queueEntry(createPerformanceResourceNavigationTimingFake({ name: 'https://bugsnag.com/image.jpg', initiatorType: 'fetch' }))
    manager.queueEntry(createPerformanceResourceNavigationTimingFake({ name: 'https://bugsnag.com/image.jpg', initiatorType: 'xmlhttprequest' }))
    manager.flushQueue()

    span.end()

    await jest.runOnlyPendingTimersAsync()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: 'custom-span',
      spanId: 'span ID 1',
      parentSpanId: undefined,
      traceId: 'trace ID 1'
    }))

    expect(delivery).not.toHaveSentSpan(expect.objectContaining({
      name: '[ResourceLoad]https://bugsnag.com/image.jpg'
    }))

    expect(delivery.requests[0].resourceSpans[0].scopeSpans[0].spans).toHaveLength(1)
  })

  it('does not create a ResourceLoad span if there is no current context', async () => {
    const delivery = new InMemoryDelivery()
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const idGenerator = new IncrementingIdGenerator()

    const client = createTestClient<BrowserSchema, BrowserConfiguration>({
      schema,
      idGenerator,
      deliveryFactory: () => delivery,
      plugins: (spanFactory, spanContextStorage) => [
        new ResourceLoadPlugin(spanFactory, spanContextStorage, Observer)
      ]
    })

    client.start({ apiKey: VALID_API_KEY })

    const span = client.startSpan('custom-span', { makeCurrentContext: false })

    manager.queueEntry(createPerformanceResourceNavigationTimingFake({ name: 'https://bugsnag.com/image.jpg' }))
    manager.flushQueue()

    span.end()

    await jest.runOnlyPendingTimersAsync()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: 'custom-span',
      spanId: 'span ID 1',
      parentSpanId: undefined,
      traceId: 'trace ID 1'
    }))

    expect(delivery).not.toHaveSentSpan(expect.objectContaining({
      name: '[ResourceLoad]https://bugsnag.com/image.jpg'
    }))

    expect(delivery.requests[0].resourceSpans[0].scopeSpans[0].spans).toHaveLength(1)
  })

  it('omits the http.flavor attribute when nextHopProtocol is an empty string', async () => {
    const delivery = new InMemoryDelivery()
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const idGenerator = new IncrementingIdGenerator()

    const client = createTestClient<BrowserSchema, BrowserConfiguration>({
      schema,
      idGenerator,
      deliveryFactory: () => delivery,
      plugins: (spanFactory, spanContextStorage) => [
        new ResourceLoadPlugin(spanFactory, spanContextStorage, Observer)
      ]
    })

    client.start({ apiKey: VALID_API_KEY })

    const span = client.startSpan('custom-span')

    manager.queueEntry(createPerformanceResourceNavigationTimingFake({ name: 'https://bugsnag.com/image1.jpg', nextHopProtocol: 'h2' }))
    manager.queueEntry(createPerformanceResourceNavigationTimingFake({ name: 'https://bugsnag.com/image2.jpg', nextHopProtocol: '' }))
    manager.flushQueue()

    span.end()

    await jest.runOnlyPendingTimersAsync()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[ResourceLoad]https://bugsnag.com/image1.jpg',
      attributes: expect.arrayContaining([{
        key: 'http.flavor',
        value: {
          stringValue: '2.0'
        }
      }])
    }))

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[ResourceLoad]https://bugsnag.com/image2.jpg',
      attributes: expect.not.arrayContaining([{
        key: 'http.flavor'
      }])
    }))
  })

  it('prevents creating a span when networkRequestCallback returns null', async () => {
    const delivery = new InMemoryDelivery()
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const idGenerator = new IncrementingIdGenerator()

    const client = createTestClient<BrowserSchema, BrowserConfiguration>({
      schema,
      idGenerator,
      deliveryFactory: () => delivery,
      plugins: (spanFactory, spanContextStorage) => [
        new ResourceLoadPlugin(spanFactory, spanContextStorage, Observer)
      ]
    })

    client.start({ apiKey: VALID_API_KEY, networkRequestCallback: (info) => info.url?.includes('personally-identifiable-information') ? null : info })

    const span = client.startSpan('custom-span')

    manager.queueEntry(createPerformanceResourceNavigationTimingFake({ name: 'https://bugsnag.com/image1.jpg' }))
    manager.queueEntry(createPerformanceResourceNavigationTimingFake({ name: 'https://bugsnag.com/personally-identifiable-information.jpg' }))
    manager.flushQueue()

    span.end()

    await jest.runOnlyPendingTimersAsync()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[ResourceLoad]https://bugsnag.com/image1.jpg',
      attributes: expect.arrayContaining([{
        key: 'http.flavor',
        value: {
          stringValue: '2.0'
        }
      }])
    }))

    expect(delivery).not.toHaveSentSpan(expect.objectContaining({
      name: '[ResourceLoad]https://bugsnag.com/personally-identifiable-information.jpg'
    }))

    expect(delivery.requests.length).toBe(1)
  })

  it('uses a modified url from networkRequestCallback', async () => {
    const delivery = new InMemoryDelivery()
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const idGenerator = new IncrementingIdGenerator()

    const client = createTestClient<BrowserSchema, BrowserConfiguration>({
      schema,
      idGenerator,
      deliveryFactory: () => delivery,
      plugins: (spanFactory, spanContextStorage) => [
        new ResourceLoadPlugin(spanFactory, spanContextStorage, Observer)
      ]
    })

    client.start({ apiKey: VALID_API_KEY, networkRequestCallback: (info) => info.url?.includes('personally-identifiable-information') ? { ...info, url: 'https://bugsnag.com/redacted-url.jpg' } : info })

    const span = client.startSpan('custom-span')

    manager.queueEntry(createPerformanceResourceNavigationTimingFake({ name: 'https://bugsnag.com/personally-identifiable-information.jpg' }))
    manager.flushQueue()

    span.end()

    await jest.runOnlyPendingTimersAsync()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[ResourceLoad]https://bugsnag.com/redacted-url.jpg'
    }))
  })
})
