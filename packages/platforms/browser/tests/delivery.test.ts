/**
 * @jest-environment jsdom
 */

import type { DeliveryPayload } from '@bugsnag/js-performance-core/lib/delivery'
import { Kind } from '@bugsnag/js-performance-core/lib/span'
import createDelivery from '../lib/delivery'

// TODO: Improve fetch mocking

// @ts-expect-error mock not assignable to global.fetch
global.fetch = jest.fn(() =>
  Promise.resolve()
)

beforeEach(() => {
  // @ts-expect-error property mockClear does not exist on fetch
  global.fetch.mockClear()
})

describe('Browser Delivery', () => {
  it('delivers a span', () => {
    const deliveryPayload: DeliveryPayload = {
      resourceSpans: [{
        resource: { attributes: [{ key: 'test-key', value: { stringValue: 'test-value' } }] },
        scopeSpans: [{
          spans: [{
            name: 'test-span',
            kind: Kind.client,
            spanId: 'test-span-id',
            traceId: 'test-trace-id',
            endTimeUnixNano: 56789,
            startTimeUnixNano: 12345,
            attributes: [{ key: 'test-span', value: { intValue: '12345' } }]
          }]
        }]
      }]
    }

    const delivery = createDelivery(global.fetch)
    delivery.send('/test', 'test-api-key', deliveryPayload)

    expect(global.fetch).toHaveBeenCalledWith('/test', expect.objectContaining({
      body: expect.stringContaining(JSON.stringify(deliveryPayload)),
      headers: expect.objectContaining({
        'Bugsnag-Api-Key': 'test-api-key'
      })
    }))
  })
})
