/**
 * @jest-environment jsdom
 */

import { InMemoryDelivery, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { PageLoadSpanPlugin } from '../lib/page-load-span-plugin'

jest.useFakeTimers()

describe('PageLoadSpanPlugin', () => {
  it('creates a span', async () => {
    const delivery = new InMemoryDelivery()
    const pageLoadSpanPlugin = new PageLoadSpanPlugin()
    const testClient = createTestClient({ deliveryFactory: () => delivery, plugins: [pageLoadSpanPlugin] })

    testClient.start({ apiKey: VALID_API_KEY, endpoint: '/test' })

    await jest.runAllTimersAsync()

    expect(delivery).toHaveSentSpan(expect.objectContaining({ name: '[FullPageLoad]/' }))
  })
})
