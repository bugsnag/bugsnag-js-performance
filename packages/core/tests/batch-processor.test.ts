import { BatchProcessor } from '../lib/batch-processor'
import {
  IncrementingClock,
  InMemoryDelivery,
  resourceAttributesSource,
  createConfiguration,
  createEndedSpan
} from '@bugsnag/js-performance-test-utilities'

jest.useFakeTimers()

describe('BatchProcessor', () => {
  it('delivers after reaching the specified span limit', () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()
    const retryQueue = { add: jest.fn(), flush: jest.fn() }
    const batchProcessor = new BatchProcessor(delivery, createConfiguration(), resourceAttributesSource, clock, retryQueue)

    // add 99 spans
    for (let i = 0; i < 99; i++) {
      batchProcessor.add(createEndedSpan())
    }

    expect(delivery.requests).toHaveLength(0)

    batchProcessor.add(createEndedSpan())

    expect(delivery.requests).toHaveLength(1)
  })

  it('delivers after the specified time limit', () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()
    const retryQueue = { add: jest.fn(), flush: jest.fn() }
    const batchProcessor = new BatchProcessor(delivery, createConfiguration(), resourceAttributesSource, clock, retryQueue)

    batchProcessor.add(createEndedSpan())

    expect(delivery.requests).toHaveLength(0)

    jest.advanceTimersByTime(30_000)

    expect(delivery.requests).toHaveLength(1)
  })

  it('restarts the timer when calling .add()', () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()
    const retryQueue = { add: jest.fn(), flush: jest.fn() }
    const batchProcessor = new BatchProcessor(delivery, createConfiguration(), resourceAttributesSource, clock, retryQueue)

    batchProcessor.add(createEndedSpan())

    jest.advanceTimersByTime(20_000)
    expect(delivery.requests).toHaveLength(0)

    batchProcessor.add(createEndedSpan())

    jest.advanceTimersByTime(20_000)
    expect(delivery.requests).toHaveLength(0)

    jest.advanceTimersByTime(10_000)
    expect(delivery.requests).toHaveLength(1)
  })

  it('prevents delivery if releaseStage not in enabledReleaseStages', () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()
    const retryQueue = { add: jest.fn(), flush: jest.fn() }
    const configuration = createConfiguration({ enabledReleaseStages: ['production'], releaseStage: 'test' })
    const batchProcessor = new BatchProcessor(delivery, configuration, resourceAttributesSource, clock, retryQueue)

    batchProcessor.add(createEndedSpan())

    jest.runAllTimers()

    expect(delivery.requests).toHaveLength(0)
  })

  it('adds delivery payload to a retry queue if delivery fails and response code is retryable', async () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()
    const retryQueue = { add: jest.fn(), flush: jest.fn() }
    const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }
    const batchProcessor = new BatchProcessor(delivery, createConfiguration({ logger }), resourceAttributesSource, clock, retryQueue)

    delivery.setNextResponseState('failure-retryable')

    batchProcessor.add(createEndedSpan())

    await jest.runAllTimersAsync()

    expect(delivery.requests).toHaveLength(1)
    expect(retryQueue.add).toHaveBeenCalled()
    expect(retryQueue.flush).not.toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith('delivery failed, adding to retry queue')
  })

  it('does not add delivery payload to a retry queue if delivery fails and response code is not retryable', async () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()
    const retryQueue = { add: jest.fn(), flush: jest.fn() }
    const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }
    const batchProcessor = new BatchProcessor(delivery, createConfiguration({ logger }), resourceAttributesSource, clock, retryQueue)

    delivery.setNextResponseState('failure-discard')

    batchProcessor.add(createEndedSpan())

    await jest.runAllTimersAsync()

    expect(delivery.requests).toHaveLength(1)
    expect(retryQueue.add).not.toHaveBeenCalled()
    expect(retryQueue.flush).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith('delivery failed')
  })

  it('flushes retry queue after a successful delivery', async () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const delivery = new InMemoryDelivery()
    const retryQueue = { add: jest.fn(), flush: jest.fn() }
    const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }
    const batchProcessor = new BatchProcessor(delivery, createConfiguration({ logger }), resourceAttributesSource, clock, retryQueue)

    batchProcessor.add(createEndedSpan())

    await jest.runAllTimersAsync()

    expect(delivery.requests).toHaveLength(1)
    expect(retryQueue.add).not.toHaveBeenCalled()
    expect(retryQueue.flush).toHaveBeenCalled()
  })
})
