import { SpanAttributes, type SpanEnded } from '@bugsnag/js-performance-core'
import { BatchProcessor } from '../lib/batch-processor'
import { randomUUID } from 'crypto'
import { IncrementingClock, resourceAttributesSource, VALID_API_KEY } from './utilities'
import { type Delivery, type InternalConfiguration, type Logger } from '../lib'

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
    const logger: Logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    }
    const config: InternalConfiguration = {
      apiKey: VALID_API_KEY,
      releaseStage: 'test',
      enabledReleaseStages: ['test'],
      appVersion: '1.0.0',
      batchInactivityTimeoutMs: 30 * 1000,
      maximumBatchSize: 100,
      endpoint: '/traces',
      logger
    }

    const batchProcessor = new BatchProcessor(delivery, config, resourceAttributesSource, clock)

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
    const logger: Logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    }
    const config: InternalConfiguration = {
      apiKey: VALID_API_KEY,
      releaseStage: 'test',
      enabledReleaseStages: ['test'],
      appVersion: '1.0.0',
      batchInactivityTimeoutMs: 30 * 1000,
      maximumBatchSize: 100,
      endpoint: '/traces',
      logger
    }
    const batchProcessor = new BatchProcessor(delivery, config, resourceAttributesSource, clock)
    batchProcessor.add(generateSpan())
    expect(delivery.send).not.toHaveBeenCalled()

    jest.runOnlyPendingTimers()

    expect(delivery.send).toHaveBeenCalledTimes(1)
  })
})
