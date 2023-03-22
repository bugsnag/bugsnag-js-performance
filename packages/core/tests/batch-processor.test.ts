import { SpanAttributes, type SpanEnded } from '@bugsnag/js-performance-core'
import { BatchProcessor } from '../lib/batch-processor'
import { randomUUID } from 'crypto'
import { IncrementingClock, resourceAttributesSource, VALID_CONFIGURATION } from './utilities'
import { type Delivery } from '../lib'

jest.useFakeTimers()

function generateSpan (): SpanEnded {
  const span: SpanEnded = {
    attributes: new SpanAttributes(new Map()),
    endTime: 12345,
    id: randomUUID(),
    name: 'test span',
    kind: 1,
    startTime: 12345,
    traceId: randomUUID()
  }

  return span
}

describe('BatchProcessor', () => {
  it('delivers after reaching the specified span limit', () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery: Delivery = { send: jest.fn() }
    const batchProcessor = new BatchProcessor(delivery, VALID_CONFIGURATION, resourceAttributesSource, clock)

    // add 99 spans
    for (let i = 0; i < 99; i++) {
      batchProcessor.add(generateSpan())
    }

    expect(delivery.send).not.toHaveBeenCalled()

    batchProcessor.add(generateSpan())

    expect(delivery.send).toHaveBeenCalledTimes(1)
  })

  it('delivers after the specified time limit', () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery: Delivery = { send: jest.fn() }
    const batchProcessor = new BatchProcessor(delivery, VALID_CONFIGURATION, resourceAttributesSource, clock)
    batchProcessor.add(generateSpan())
    expect(delivery.send).not.toHaveBeenCalled()

    jest.advanceTimersByTime(30_000)

    expect(delivery.send).toHaveBeenCalledTimes(1)
  })

  it('restarts the timer when calling .add()', () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery: Delivery = { send: jest.fn() }
    const batchProcessor = new BatchProcessor(delivery, VALID_CONFIGURATION, resourceAttributesSource, clock)
    batchProcessor.add(generateSpan())
    jest.advanceTimersByTime(20_000)
    expect(delivery.send).not.toHaveBeenCalled()
    batchProcessor.add(generateSpan())
    jest.advanceTimersByTime(20_000)
    expect(delivery.send).not.toHaveBeenCalled()
    jest.advanceTimersByTime(10_000)
    expect(delivery.send).toHaveBeenCalledTimes(1)
  })

  it('prevents delivery if releaseStage not in enabledReleaseStages', () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery: Delivery = { send: jest.fn() }
    const batchProcessor = new BatchProcessor(delivery, { ...VALID_CONFIGURATION, enabledReleaseStages: ['production'], releaseStage: 'test' }, resourceAttributesSource, clock)
    batchProcessor.add(generateSpan())
    jest.runAllTimers()
    expect(delivery.send).not.toHaveBeenCalled()
  })
})
