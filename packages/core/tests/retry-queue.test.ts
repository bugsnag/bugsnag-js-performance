import { randomUUID } from 'crypto'
import { type DeliverySpan, type DeliveryPayload } from '../lib'
import InMemoryQueue from '../lib/retry-queue'
import { VALID_API_KEY } from './utilities'

describe('RetryQueue', () => {
  it('calls delivery after flushing', () => {
    const delivery = { send: jest.fn() }
    const retryQueue = new InMemoryQueue(delivery, '/traces', VALID_API_KEY)
    const payload = generateFullPayload()

    retryQueue.add(payload)
    retryQueue.flush()

    expect(delivery.send).toHaveBeenCalledWith('/traces', VALID_API_KEY, payload)
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
    const retryQueue = new InMemoryQueue(delivery, '/traces', VALID_API_KEY)

    retryQueue.add(initialPayload)

    // add 1000 spans
    for (let i = 0; i <= 9; i++) {
      retryQueue.add(generateFullPayload())
    }

    retryQueue.flush()

    // initial payload should have been knocked out of the queue
    expect(delivery.send).not.toHaveBeenCalledWith('/traces', VALID_API_KEY, initialPayload)
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

function generateFullPayload (): DeliveryPayload {
  return {
    resourceSpans: [{
      resource: { attributes: [{ key: 'bugnsag.test.attribute', value: { stringValue: '1.0.0' } }] },
      scopeSpans: [{
        spans: new Array(100).fill(generateSpan())
      }]
    }]
  }
}
