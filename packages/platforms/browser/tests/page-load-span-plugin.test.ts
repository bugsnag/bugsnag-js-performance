/**
 * @jest-environment jsdom
 * @jest-environment-options { "url": "https://bugsnag.com/page-load-span-plugin", "referrer": "https://bugsnag.com" }
 */

import { InMemoryDelivery, IncrementingClock, PerformanceObserverManager, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { FullPageLoadPlugin } from '../lib/auto-instrumentation/full-page-load-plugin'
import { WebVitalsTracker } from '../lib/auto-instrumentation/web-vitals-tracker'
import { createSchema } from '../lib/config'
import { type OnSettle } from '../lib/on-settle'

jest.useFakeTimers()

describe('FullPageLoadPlugin', () => {
  it('Automatically creates and delivers a pageLoadSpan', () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => { setTimeout(() => { onSettleCallback(1234) }, 1234) }
    const manager = new PerformanceObserverManager()
    const webVitalsTracker = new WebVitalsTracker(manager.createPerformanceObserverFakeClass(), performance)
    const testClient = createTestClient({
      clock,
      schema: createSchema(window.location.hostname),
      deliveryFactory: () => delivery,
      plugins: (spanFactory) => [new FullPageLoadPlugin(document, window.location, spanFactory, webVitalsTracker, onSettle)]
    })

    testClient.start({ apiKey: VALID_API_KEY })

    manager.queueEntry(manager.createPerformanceNavigationTimingFake({ responseStart: 123 }))
    manager.queueEntry(manager.createPerformanceEntryFake({ name: 'first-contentful-paint', entryType: 'paint', startTime: 234 }))
    manager.flushQueue()

    jest.runAllTimers()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[FullPageLoad]/page-load-span-plugin',
      startTimeUnixNano: '0',
      endTimeUnixNano: '1234000000',
      kind: 3,
      spanId: 'a random 64 bit string',
      traceId: 'a random 128 bit string',
      events: [
        {
          name: 'fcp',
          timeUnixNano: '234000000'
        },
        {
          name: 'ttfb',
          timeUnixNano: '123000000'
        }
      ]
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
    const webVitalsTracker = { timeToFirstByte: 0, attachTo: jest.fn() } as unknown as WebVitalsTracker
    const testClient = createTestClient({
      schema: createSchema(window.location.hostname),
      deliveryFactory: () => delivery,
      plugins: (spanFactory) => [new FullPageLoadPlugin(document, window.location, spanFactory, webVitalsTracker, onSettle)]
    })

    testClient.start({ apiKey: VALID_API_KEY, autoInstrumentFullPageLoads: false })

    jest.runAllTimers()

    expect(delivery.requests).toHaveLength(0)
  })
})
