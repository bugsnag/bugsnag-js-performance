/**
 * @jest-environment jsdom
 */

import { InMemoryDelivery, IncrementingIdGenerator, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { ResourceLoadPlugin } from '../../lib/auto-instrumentation/resource-load-plugin'
import { PerformanceObserverManager } from '../utilities'
import { createPerformanceResourceNavigationTimingFake } from '../utilities/performance-entry'

jest.useFakeTimers()

describe('ResourceLoadPlugin', () => {
  it('automatically creates a ResourceLoad span for a custom span', async () => {
    const delivery = new InMemoryDelivery()
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const idGenerator = new IncrementingIdGenerator()

    const client = createTestClient({
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

    const client = createTestClient({
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

    const client = createTestClient({
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
})
