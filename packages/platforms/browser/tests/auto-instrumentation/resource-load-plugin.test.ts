/**
 * @jest-environment jsdom
 */

import { InMemoryDelivery, IncrementingIdGenerator, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { ResourceLoadPlugin } from '../../lib/auto-instrumentation/resource-load-plugin'
import { PerformanceObserverManager } from '../utilities'
import { createPerformanceResourceNavigationTimingFake } from '../utilities/performance-entry'

describe('ResourceLoadPlugin', () => {
  it('automatically creates a ResourceLoad span for a custom span', async () => {
    jest.useFakeTimers()

    const delivery = new InMemoryDelivery()
    const manager = new PerformanceObserverManager()
    const Observer = manager.createPerformanceObserverFakeClass()
    const idGenerator = new IncrementingIdGenerator()

    const client = createTestClient({
      idGenerator,
      deliveryFactory: () => delivery,
      plugins: (spanFactory) => [
        new ResourceLoadPlugin(spanFactory, Observer)
      ]
    })

    client.start({ apiKey: VALID_API_KEY })

    const span = client.startSpan('custom-span')

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

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[ResourceLoad]https://bugsnag.com/image.jpg',
      spanId: 'span ID 2',
      parentSpanId: 'span ID 1',
      traceId: 'trace ID 1'
    }))
  })
})
