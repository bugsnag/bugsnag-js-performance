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
      plugins: (spanFactory) => [new PageLoadSpanPlugin(spanFactory)]
    })

    testClient.start({ apiKey: VALID_API_KEY, endpoint: '/test' })

    jest.runAllTimers()

    const deliveredSpan = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]

    expect(deliveredSpan).toStrictEqual(expect.objectContaining({
      name: '[FullPageLoad]/'
    }))
  })

  it('Does not create a pageLoadSpan with autoInstrumentFullPageLoads set to false', () => {
    const delivery = { send: jest.fn() }
    const testClient = createTestClient({
      schema: createSchema(window.location.hostname),
      deliveryFactory: () => delivery,
      plugins: (spanFactory) => [new PageLoadSpanPlugin(spanFactory)]
    })

    testClient.start({ apiKey: VALID_API_KEY, endpoint: '/test', autoInstrumentFullPageLoads: false })

    jest.runAllTimers()

    expect(delivery.send).not.toHaveBeenCalled()
  })
})
