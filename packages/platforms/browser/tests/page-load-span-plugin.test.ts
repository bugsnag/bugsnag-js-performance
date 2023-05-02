/**
 * @jest-environment jsdom
 */

import { InMemoryDelivery, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { PageLoadSpanPlugin } from '../lib/page-load-span-plugin'
import { createSchema } from '../lib/config'

jest.useFakeTimers()

describe('PageLoadSpanPlugin', () => {
  it('Automatically creates and delivers a pageLoadSpan', () => {
    const delivery = new InMemoryDelivery()
    const testClient = createTestClient({
      schema: createSchema(window.location.hostname),
      deliveryFactory: () => delivery,
      plugins: (spanFactory) => [new PageLoadSpanPlugin(document, window.location, spanFactory, '/example-page')]
    })

    testClient.start({ apiKey: VALID_API_KEY })

    jest.runAllTimers()

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[FullPageLoad]/example-page'
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
          stringValue: '/example-page'
        }
      },
      {
        key: 'bugsnag.browser.page.url',
        value: {
          stringValue: 'http://localhost/'
        }
      },
      {
        key: 'bugsnag.browser.page.referrer',
        value: {
          stringValue: ''
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
      plugins: (spanFactory) => [new PageLoadSpanPlugin(document, window.location, spanFactory, '/example-page')]
    })

    testClient.start({ apiKey: VALID_API_KEY, autoInstrumentFullPageLoads: false })

    jest.runAllTimers()

    expect(delivery.requests).toHaveLength(0)
  })
})
