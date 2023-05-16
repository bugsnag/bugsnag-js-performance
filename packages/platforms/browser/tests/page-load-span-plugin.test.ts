/**
 * @jest-environment jsdom
 * @jest-environment-options { "url": "https://bugsnag.com/page-load-span-plugin", "referrer": "https://bugsnag.com" }
 */

import { InMemoryDelivery, IncrementingClock, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { FullPageLoadPlugin } from '../lib/auto-instrumentation/full-page-load-plugin'
import { createSchema } from '../lib/config'
import { type OnSettle } from '../lib/on-settle'
import { WebVitals } from '../lib/web-vitals'

jest.useFakeTimers()

describe('FullPageLoadPlugin', () => {
  it('Automatically creates and delivers a pageLoadSpan', () => {
    const ttfbEntry = {
      duration: 1234,
      entryType: 'navigation',
      name: 'test',
      responseStart: 0.5,
      startTime: 0,
      toJSON: jest.fn()
    }

    const fcpEntry = {
      name: 'first-contentful-paint',
      entryType: 'paint',
      duration: 64,
      startTime: 128,
      toJSON: jest.fn()
    }

    const performance = {
      getEntriesByName: () => [fcpEntry],
      getEntriesByType: () => [ttfbEntry],
      timing: {
        responseStart: 0.5,
        navigationStart: 0
      }
    }

    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(1234) }
    const webVitals = new WebVitals(performance, clock)
    const testClient = createTestClient({
      clock,
      deliveryFactory: () => delivery,
      schema: createSchema(window.location.hostname),
      plugins: (spanFactory) => [new FullPageLoadPlugin(document, window.location, spanFactory, webVitals, onSettle)]
    })

    testClient.start({ apiKey: VALID_API_KEY })

    jest.runAllTimers()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[FullPageLoad]/page-load-span-plugin',
      events: [
        {
          name: 'fcp',
          timeUnixNano: '128000000'
        },
        {
          name: 'ttfb',
          timeUnixNano: '500000'
        }
      ]
    }))

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

    const deliveredSpanEvents = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0].events
    expect(deliveredSpanEvents).toStrictEqual(expect.arrayContaining([
      {
        name: 'ttfb',
        timeUnixNano: '500000'
      }
    ]))
  })

  it('Does not create a pageLoadSpan with autoInstrumentFullPageLoads set to false', () => {
    const clock = new IncrementingClock()
    const delivery = new InMemoryDelivery()
    const onSettle: OnSettle = (onSettleCallback) => { onSettleCallback(1234) }
    const performance = { getEntriesByType: jest.fn(), getEntriesByName: jest.fn(), timing: { navigationStart: 0, responseStart: 0 } }
    const webVitals = new WebVitals(performance, clock)
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
