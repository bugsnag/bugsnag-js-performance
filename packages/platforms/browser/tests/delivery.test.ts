/**
 * @jest-environment jsdom
 */

import { type DeliveryPayload } from '@bugsnag/js-performance-core'
import { ControllableBackgroundingListener } from '@bugsnag/js-performance-test-utilities'
import createBrowserDeliveryFactory from '../lib/delivery'

describe('Browser Delivery', () => {
  it('delivers a span', () => {
    const fetch = jest.fn(() => Promise.resolve({} as unknown as Response))
    const backgroundingListener = new ControllableBackgroundingListener()

    const deliveryPayload: DeliveryPayload = {
      resourceSpans: [{
        resource: { attributes: [{ key: 'test-key', value: { stringValue: 'test-value' } }] },
        scopeSpans: [{
          spans: [{
            name: 'test-span',
            kind: 1,
            spanId: 'test-span-id',
            traceId: 'test-trace-id',
            endTimeUnixNano: '56789',
            startTimeUnixNano: '12345',
            attributes: [{ key: 'test-span', value: { intValue: '12345' } }]
          }]
        }]
      }]
    }

    const deliveryFactory = createBrowserDeliveryFactory(fetch, backgroundingListener)
    const delivery = deliveryFactory('test-api-key', '/test')
    delivery.send(deliveryPayload)

    expect(fetch).toHaveBeenCalledWith('/test', {
      method: 'POST',
      keepalive: false,
      body: JSON.stringify(deliveryPayload),
      headers: {
        'Bugsnag-Api-Key': 'test-api-key',
        'Bugsnag-Span-Sampling': '1.0:1',
        'Content-Type': 'application/json'
      }
    })
  })

  it('delivers a span with keepalive = true when the app is backgrounded', () => {
    const fetch = jest.fn(() => Promise.resolve({} as unknown as Response))
    const backgroundingListener = new ControllableBackgroundingListener()

    const deliveryPayload: DeliveryPayload = {
      resourceSpans: [{
        resource: { attributes: [{ key: 'test-key', value: { stringValue: 'test-value' } }] },
        scopeSpans: [{
          spans: [{
            name: 'test-span',
            kind: 1,
            spanId: 'test-span-id',
            traceId: 'test-trace-id',
            endTimeUnixNano: '56789',
            startTimeUnixNano: '12345',
            attributes: [{ key: 'test-span', value: { intValue: '12345' } }]
          }]
        }]
      }]
    }

    const deliveryFactory = createBrowserDeliveryFactory(fetch, backgroundingListener)
    const delivery = deliveryFactory('test-api-key', '/test')

    backgroundingListener.sendToBackground()

    delivery.send(deliveryPayload)

    expect(fetch).toHaveBeenCalledWith('/test', {
      method: 'POST',
      keepalive: true,
      body: JSON.stringify(deliveryPayload),
      headers: {
        'Bugsnag-Api-Key': 'test-api-key',
        'Bugsnag-Span-Sampling': '1.0:1',
        'Content-Type': 'application/json'
      }
    })
  })

  it('delivers a span with keepalive = false when the app is returned to the foreground', () => {
    const fetch = jest.fn(() => Promise.resolve({} as unknown as Response))
    const backgroundingListener = new ControllableBackgroundingListener()

    const deliveryPayload: DeliveryPayload = {
      resourceSpans: [{
        resource: { attributes: [{ key: 'test-key', value: { stringValue: 'test-value' } }] },
        scopeSpans: [{
          spans: [{
            name: 'test-span',
            kind: 1,
            spanId: 'test-span-id',
            traceId: 'test-trace-id',
            endTimeUnixNano: '56789',
            startTimeUnixNano: '12345',
            attributes: [{ key: 'test-span', value: { intValue: '12345' } }]
          }]
        }]
      }]
    }

    const deliveryFactory = createBrowserDeliveryFactory(fetch, backgroundingListener)
    const delivery = deliveryFactory('test-api-key', '/test')

    backgroundingListener.sendToBackground()
    backgroundingListener.sendToForeground()

    delivery.send(deliveryPayload)

    expect(fetch).toHaveBeenCalledWith('/test', {
      method: 'POST',
      keepalive: false,
      body: JSON.stringify(deliveryPayload),
      headers: {
        'Bugsnag-Api-Key': 'test-api-key',
        'Bugsnag-Span-Sampling': '1.0:1',
        'Content-Type': 'application/json'
      }
    })
  })
})
