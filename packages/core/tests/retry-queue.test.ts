import { randomUUID } from 'crypto'
import { type DeliverySpan, type DeliveryPayload } from '../lib'
import InMemoryQueue from '../lib/retry-queue'

describe('RetryQueue', () => {
  it('calls delivery after flushing', async () => {
    const delivery = { send: jest.fn() }
    const retryQueue = new InMemoryQueue(delivery, '/traces', 'valid-api-key')
    const payload = generateFullPayload()

    retryQueue.add(payload)
    await retryQueue.flush()

    expect(delivery.send).toHaveBeenCalledWith('/traces', 'valid-api-key', payload)
  })

  it('limits the number of spans in the queue', () => {
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

    const delivery = { send: jest.fn() }
    const retryQueue = new InMemoryQueue(delivery, '/traces', 'valid-api-key')

    retryQueue.add(initialPayload)

    // add 1000 spans
    for (let i = 0; i <= 9; i++) {
      retryQueue.add(generateFullPayload())
    }

    retryQueue.flush()

    // initial payload should have been knocked out of the queue
    expect(delivery.send).not.toHaveBeenCalledWith('/traces', 'valid-api-key', initialPayload)
  })

  it('awaits current delivery before flushing queue', async () => {
    const endpoint = '/traces'
    const apiKey = 'valid-api-key'
    let outstandingRequests = 0

    const delivery = {
      send: jest.fn(() => {
        ++outstandingRequests
        expect(outstandingRequests).toBe(1)

        return new Promise<void>((resolve) => {
          setTimeout(() => {
            --outstandingRequests
            expect(outstandingRequests).toBe(0)

            resolve()
          }, 0)
        })
      })
    }

    // @ts-expect-error something
    const retryQueue = new InMemoryQueue(delivery, endpoint, apiKey)

    const payload1 = generateFullPayload(1)
    const payload2 = generateFullPayload(1)
    const payload3 = generateFullPayload(1)

    retryQueue.add(payload1)
    const flush1 = retryQueue.flush()

    retryQueue.add(payload2)
    const flush2 = retryQueue.flush()

    retryQueue.add(payload3)
    const flush3 = retryQueue.flush()

    await Promise.all([flush1, flush2, flush3])

    expect(delivery.send).toHaveBeenNthCalledWith(1, endpoint, apiKey, payload1)
    expect(delivery.send).toHaveBeenNthCalledWith(2, endpoint, apiKey, payload2)
    expect(delivery.send).toHaveBeenNthCalledWith(3, endpoint, apiKey, payload3)
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
