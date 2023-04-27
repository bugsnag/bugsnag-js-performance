/**
 * @jest-environment jsdom
 */

import { InMemoryDelivery, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { PageLoadSpanPlugin } from '../lib/page-load-span-plugin'

jest.useFakeTimers()

describe('PageLoadSpanPlugin', () => {
  it('Automatically creates and delivers a pageLoadSpan', async () => {
    const delivery = new InMemoryDelivery()
    const pageLoadSpanPlugin = new PageLoadSpanPlugin()
    const testClient = createTestClient({ deliveryFactory: () => delivery, plugins: [pageLoadSpanPlugin] })

    testClient.start({ apiKey: VALID_API_KEY, endpoint: '/test' })

    await jest.runAllTimersAsync()

    const deliveredSpan = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]

    expect(deliveredSpan).toStrictEqual(expect.objectContaining({
      name: '[FullPageLoad]/',
      attributes: expect.arrayContaining([
        {
          key: 'bugsnag.span.category',
          value: {
            stringValue: 'full_page_load'
          }
        },
        {
          key: 'bugsnag.browser.page.route',
          value: {
            stringValue: '/'
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
      ])
    }))
  })
})
