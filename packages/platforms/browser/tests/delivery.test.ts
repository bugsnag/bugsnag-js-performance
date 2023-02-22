/**
 * @jest-environment jsdom
 */

import type { DeliveryPayload } from '@bugsnag/js-performance-core/lib/delivery'
import { Kind } from '@bugsnag/js-performance-core/lib/span'
import createDelivery from '../lib/delivery'

describe('Browser Delivery', () => {
  it('delivers a span', () => {
    const mockFetch = jest.fn(() => Promise.resolve({} as unknown as Response))
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

    const delivery = createDelivery(mockFetch)
    delivery.send('/test', 'test-api-key', deliveryPayload)

    expect(mockFetch).toHaveBeenCalledWith('/test', {
      method: 'POST',
      body: JSON.stringify(deliveryPayload),
      headers: {
        'Bugsnag-Api-Key': 'test-api-key',
        'Content-Type': 'application/json'
      }
    })
  })
})
