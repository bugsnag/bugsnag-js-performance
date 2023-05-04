/**
 * @jest-environment jsdom
 * @jest-environment-options { "url": "https://bugsnag.com/page-load-span-plugin", "referrer": "https://bugsnag.com" }
 */

import { InMemoryDelivery, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { createSchema } from '../lib/config'
import { FullPageLoadPlugin } from '../lib/auto-instrumentation/full-page-load-plugin'

jest.useFakeTimers()

describe('FullPageLoadPlugin', () => {
  it('Automatically creates and delivers a pageLoadSpan', () => {
    const delivery = new InMemoryDelivery()
    const testClient = createTestClient({
      schema: createSchema(window.location.hostname),
      deliveryFactory: () => delivery,
      plugins: (spanFactory) => [new FullPageLoadPlugin(document, window.location, spanFactory)]
    })

    testClient.start({ apiKey: VALID_API_KEY })

    jest.runAllTimers()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[FullPageLoad]/page-load-span-plugin'
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
        key: 'bugsnag.browser.page.url',
        value: {
          stringValue: 'https://bugsnag.com/page-load-span-plugin'
        }
      },
      {
        key: 'bugsnag.browser.page.referrer',
        value: {
          stringValue: 'https://bugsnag.com/'
        }
      },
      {
        key: 'bugsnag.browser.page.title',
        value: {
          stringValue: ''
        }
      }
    ]))
  })

  it('Does not create a pageLoadSpan with autoInstrumentFullPageLoads set to false', () => {
    const delivery = new InMemoryDelivery()
    const testClient = createTestClient({
      schema: createSchema(window.location.hostname),
      deliveryFactory: () => delivery,
      plugins: (spanFactory) => [new FullPageLoadPlugin(document, window.location, spanFactory)]
    })

    testClient.start({ apiKey: VALID_API_KEY, autoInstrumentFullPageLoads: false })

    jest.runAllTimers()

    expect(delivery.requests).toHaveLength(0)
  })
})
