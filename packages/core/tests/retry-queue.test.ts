import { randomUUID } from 'crypto'
import {
  type Delivery,
  type DeliverySpan,
  type DeliveryPayload,
  type ResponseState,
  InMemoryQueue
} from '../lib'
import { InMemoryDelivery } from '@bugsnag/js-performance-test-utilities'

const createdTime = new Date().getTime()

describe('RetryQueue', () => {
  it('calls delivery after flushing', async () => {
    const delivery = new InMemoryDelivery()
    const retryQueue = new InMemoryQueue(delivery, '/traces', 'valid-api-key', 1000)
    const payload = generateFullPayload()

    retryQueue.add(payload, createdTime)
    await retryQueue.flush()

    expect(delivery.requests).toStrictEqual([
      {
        apiKey: 'valid-api-key',
        endpoint: '/traces',
        payload
      }
    ])
  })

  it('limits the number of spans in the queue', async () => {
    const initialPayload: DeliveryPayload = {
      resourceSpans: [{
        resource: { attributes: [] },
        scopeSpans: [{
          spans: [{
            name: 'Custom/Test Span',
            kind: 3,
            endTimeUnixNano: '5678',
            startTimeUnixNano: '1234',
            spanId: 'valid-span-id',
            traceId: 'valid-trace-id',
            attributes: []
          }]
        }]
      }]
    }

    const delivery = new InMemoryDelivery()
    const endpoint = '/traces'
    const apiKey = 'valid-api-key'
    const retryQueue = new InMemoryQueue(delivery, endpoint, apiKey, 1000)

    retryQueue.add(initialPayload, createdTime)

    const expectedPayloads: Array<{
      apiKey: string
      endpoint: string
      payload: DeliveryPayload
    }> = []

    // add 1000 spans
    for (let i = 0; i <= 9; i++) {
      const payload = generateFullPayload()
      expectedPayloads.push({ apiKey, endpoint, payload })

      retryQueue.add(payload, createdTime)
    }

    await retryQueue.flush()

    // initial payload should have been knocked out of the queue
    expect(delivery.requests).toStrictEqual(expectedPayloads)
  })

  it('awaits current delivery before flushing queue', async () => {
    const endpoint = '/traces'
    const apiKey = 'valid-api-key'
    let outstandingRequests = 0

    const delivery: Delivery = {
      send: jest.fn((endpoint, apiKey, payload) => {
        ++outstandingRequests
        expect(outstandingRequests).toBe(1)

        return new Promise((resolve) => {
          setTimeout(() => {
            --outstandingRequests
            expect(outstandingRequests).toBe(0)

            resolve({ state: 'success' as ResponseState })
          }, 0)
        })
      })
    }

    const retryQueue = new InMemoryQueue(delivery, endpoint, apiKey, 1000)

    const payload1 = generateFullPayload(1)
    const payload2 = generateFullPayload(1)
    const payload3 = generateFullPayload(1)

    retryQueue.add(payload1, createdTime)
    const flush1 = retryQueue.flush()

    retryQueue.add(payload2, createdTime)
    const flush2 = retryQueue.flush()

    retryQueue.add(payload3, createdTime)
    const flush3 = retryQueue.flush()

    await Promise.all([flush1, flush2, flush3])

    expect(delivery.send).toHaveBeenNthCalledWith(1, endpoint, apiKey, payload1)
    expect(delivery.send).toHaveBeenNthCalledWith(2, endpoint, apiKey, payload2)
    expect(delivery.send).toHaveBeenNthCalledWith(3, endpoint, apiKey, payload3)
  })

  it('drops payloads that are at least 24 hours old', async () => {
    jest.useFakeTimers()

    const delivery = new InMemoryDelivery()
    const retryQueue = new InMemoryQueue(delivery, '/traces', 'valid-api-key', 1000)
    const payload = generateFullPayload()

    retryQueue.add(payload, createdTime)
    await jest.advanceTimersByTimeAsync(24 * 60 * 60_000)

    await retryQueue.flush()

    expect(delivery.requests).toStrictEqual([])
  })
})

function generateSpan (): DeliverySpan {
  return {
    name: 'Custom/Generated Span',
    kind: 1,
    spanId: randomUUID(),
    traceId: randomUUID(),
    startTimeUnixNano: '12340000',
    endTimeUnixNano: '56780000',
    attributes: []
  }
}

function generateFullPayload (spans: number = 100): DeliveryPayload {
  return {
    resourceSpans: [{
      resource: { attributes: [{ key: 'bugnsag.test.attribute', value: { stringValue: '1.0.0' } }] },
      scopeSpans: [{
        spans: new Array(spans).fill(generateSpan())
      }]
    }]
  }
}
