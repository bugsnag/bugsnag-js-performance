import { SpanAttributes, type SpanEnded } from '@bugsnag/js-performance-core'
import { Queue } from '../lib/queue'
import { randomUUID } from 'crypto'

jest.useFakeTimers()

function generateSpan (): SpanEnded {
  return {
    attributes: new SpanAttributes(new Map()),
    endTime: 12345,
    id: randomUUID(),
    name: 'test span',
    kind: 1,
    startTime: 12345,
    traceId: randomUUID()
  }
}

describe('Queue', () => {
  it('delivers after reaching the specified span limit', () => {
    const callback = jest.fn()
    const queue = new Queue(callback)

    // add 100 spans
    for (let i = 0; i <= 100; i++) {
      queue.add(generateSpan())
    }

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('delivers after the specified time limit', () => {
    const callback = jest.fn()
    const queue = new Queue(callback)
    queue.add(generateSpan())
    expect(callback).not.toHaveBeenCalled()

    jest.runOnlyPendingTimers()

    expect(callback).toHaveBeenCalled()
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
