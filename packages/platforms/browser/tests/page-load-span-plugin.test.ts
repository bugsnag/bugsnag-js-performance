/**
 * @jest-environment jsdom
 * @jest-environment-options { "url": "https://bugsnag.com/page-load-span-plugin", "referrer": "https://bugsnag.com" }
 */

import { InMemoryDelivery, IncrementingClock, PerformanceObserverManager, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { FullPageLoadPlugin } from '../lib/auto-instrumentation/full-page-load-plugin'
import { type WebVitals } from '../lib/web-vitals'
import { createSchema } from '../lib/config'
import { type OnSettle } from '../lib/on-settle'

jest.useFakeTimers()

describe('FullPageLoadPlugin', () => {
  it('Automatically creates and delivers a pageLoadSpan', () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => { setTimeout(() => { onSettleCallback(1234) }, 1234) }
    const manager = new PerformanceObserverManager()
    const webVitals = { attachTo: jest.fn() } as unknown as WebVitals
    const testClient = createTestClient({
      clock,
      schema: createSchema(window.location.hostname),
      deliveryFactory: () => delivery,
      plugins: (spanFactory) => [new FullPageLoadPlugin(document, window.location, spanFactory, webVitals, onSettle)]
    })

    testClient.start({ apiKey: VALID_API_KEY })

    manager.queueEntry(manager.createPerformanceNavigationTimingFake({ responseStart: 123 }))
    manager.flushQueue()

    jest.runAllTimers()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[FullPageLoad]/page-load-span-plugin',
      startTimeUnixNano: '0',
      endTimeUnixNano: '1234000000',
      kind: 3,
      spanId: 'a random 64 bit string',
      traceId: 'a random 128 bit string'
    }))

    // Attributes test
    const deliveredSpanAttributes = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0].attributes
    expect(deliveredSpanAttributes).toStrictEqual(expect.arrayContaining([
      {
        key: 'bugsnag.span.category',
        value: {
          stringValue: 'full_page_load'
        }
      },
      {
        key: 'bugsnag.browser.page.route',
        value: {
          stringValue: '/page-load-span-plugin'
        }
      },
      {
        key: 'bugsnag.browser.page.referrer',
        value: {
          stringValue: 'https://bugsnag.com/'
        }
      }
    ]))
  })

  it('Does not create a pageLoadSpan with autoInstrumentFullPageLoads set to false', () => {
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(1234) }
    const webVitals = { timeToFirstByte: 0, attachTo: jest.fn() } as unknown as WebVitals
    const testClient = createTestClient({
      schema: createSchema(window.location.hostname),
      deliveryFactory: () => delivery,
      plugins: (spanFactory) => [new FullPageLoadPlugin(document, window.location, spanFactory, webVitals, onSettle)]
    })

    testClient.start({ apiKey: VALID_API_KEY, autoInstrumentFullPageLoads: false })

    jest.runAllTimers()

    expect(delivery.requests).toHaveLength(0)
  })
})
