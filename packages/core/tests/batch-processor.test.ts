import { BatchProcessor } from '../lib/batch-processor'
import { TracePayloadEncoder } from '../lib/delivery'
import { InMemoryPersistence } from '../lib/persistence'
import ProbabilityFetcher from '../lib/probability-fetcher'
import ProbabilityManager from '../lib/probability-manager'
import Sampler from '../lib/sampler'
import {
  IncrementingClock,
  InMemoryDelivery,
  resourceAttributesSource,
  createConfiguration,
  createEndedSpan
} from '@bugsnag/js-performance-test-utilities'

jest.useFakeTimers()

const minimalProbabilityManager = { setProbability () { return Promise.resolve() } }

describe('BatchProcessor', () => {
  it('delivers after reaching the specified span limit', async () => {
    const delivery = new InMemoryDelivery()
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const batchProcessor = new BatchProcessor(
      delivery,
      createConfiguration(),
      { add: jest.fn(), flush: jest.fn() },
      new Sampler(1.0),
      minimalProbabilityManager,
      new TracePayloadEncoder(clock, createConfiguration(), resourceAttributesSource)
    )

    // add 99 spans
    for (let i = 0; i < 99; i++) {
      batchProcessor.add(createEndedSpan())
    }

    expect(delivery.requests).toHaveLength(0)

    batchProcessor.add(createEndedSpan())

    await jest.advanceTimersByTimeAsync(0)

    expect(delivery.requests).toHaveLength(1)
  })

  it('delivers after the specified time limit', async () => {
    const delivery = new InMemoryDelivery()
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const batchProcessor = new BatchProcessor(
      delivery,
      createConfiguration(),
      { add: jest.fn(), flush: jest.fn() },
      new Sampler(1.0),
      minimalProbabilityManager,
      new TracePayloadEncoder(clock, createConfiguration(), resourceAttributesSource)
    )

    batchProcessor.add(createEndedSpan())

    expect(delivery.requests).toHaveLength(0)

    await jest.advanceTimersByTimeAsync(30_000)

    expect(delivery.requests).toHaveLength(1)
  })

  it('restarts the timer when calling .add()', async () => {
    const delivery = new InMemoryDelivery()
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const batchProcessor = new BatchProcessor(
      delivery,
      createConfiguration(),
      { add: jest.fn(), flush: jest.fn() },
      new Sampler(1.0),
      minimalProbabilityManager,
      new TracePayloadEncoder(clock, createConfiguration(), resourceAttributesSource)
    )

    batchProcessor.add(createEndedSpan())

    await jest.advanceTimersByTimeAsync(20_000)
    expect(delivery.requests).toHaveLength(0)

    batchProcessor.add(createEndedSpan())

    await jest.advanceTimersByTimeAsync(20_000)
    expect(delivery.requests).toHaveLength(0)

    await jest.advanceTimersByTimeAsync(10_000)
    expect(delivery.requests).toHaveLength(1)
  })

  it('prevents delivery if releaseStage not in enabledReleaseStages', async () => {
    const delivery = new InMemoryDelivery()
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const configuration = createConfiguration({ enabledReleaseStages: ['production'], releaseStage: 'test' })
    const batchProcessor = new BatchProcessor(
      delivery,
      configuration,
      { add: jest.fn(), flush: jest.fn() },
      new Sampler(1.0),
      minimalProbabilityManager,
      new TracePayloadEncoder(clock, configuration, resourceAttributesSource)
    )

    batchProcessor.add(createEndedSpan())

    await batchProcessor.flush()

    expect(delivery.requests).toHaveLength(0)
  })

  it('adds delivery payload to a retry queue if delivery fails and response code is retryable', async () => {
    const delivery = new InMemoryDelivery()
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const retryQueue = { add: jest.fn(), flush: jest.fn() }
    const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }

    const batchProcessor = new BatchProcessor(
      delivery,
      createConfiguration({ logger }),
      retryQueue,
      new Sampler(1.0),
      minimalProbabilityManager,
      new TracePayloadEncoder(clock, createConfiguration(), resourceAttributesSource)
    )

    delivery.setNextResponseState('failure-retryable')

    batchProcessor.add(createEndedSpan())

    await batchProcessor.flush()

    expect(delivery.requests).toHaveLength(1)
    expect(retryQueue.add).toHaveBeenCalled()
    expect(retryQueue.flush).not.toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith('delivery failed, adding to retry queue')
  })

  it('does not add delivery payload to a retry queue if delivery fails and response code is not retryable', async () => {
    const delivery = new InMemoryDelivery()
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const retryQueue = { add: jest.fn(), flush: jest.fn() }
    const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }

    const batchProcessor = new BatchProcessor(
      delivery,
      createConfiguration({ logger }),
      retryQueue,
      new Sampler(1.0),
      minimalProbabilityManager,
      new TracePayloadEncoder(clock, createConfiguration(), resourceAttributesSource)
    )

    delivery.setNextResponseState('failure-discard')

    batchProcessor.add(createEndedSpan())

    await batchProcessor.flush()

    expect(delivery.requests).toHaveLength(1)
    expect(retryQueue.add).not.toHaveBeenCalled()
    expect(retryQueue.flush).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith('delivery failed')
  })

  it('flushes retry queue after a successful delivery', async () => {
    const delivery = new InMemoryDelivery()
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const retryQueue = { add: jest.fn(), flush: jest.fn() }
    const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }

    const batchProcessor = new BatchProcessor(
      delivery,
      createConfiguration({ logger }),
      retryQueue,
      new Sampler(1.0),
      minimalProbabilityManager,
      new TracePayloadEncoder(clock, createConfiguration(), resourceAttributesSource)
    )

    batchProcessor.add(createEndedSpan())

    await batchProcessor.flush()

    expect(delivery.requests).toHaveLength(1)
    expect(retryQueue.add).not.toHaveBeenCalled()
    expect(retryQueue.flush).toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('updates the sampling probability when the response returns a new probability', async () => {
    const delivery = new InMemoryDelivery()
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const sampler = new Sampler(1.0)
    const persistence = new InMemoryPersistence()

    persistence.save('bugsnag-sampling-probability', { value: 1.0, time: Date.now() })

    const batchProcessor = new BatchProcessor(
      delivery,
      createConfiguration(),
      { add: jest.fn(), flush: jest.fn() },
      sampler,
      await ProbabilityManager.create(
        persistence,
        sampler,
        new ProbabilityFetcher(delivery, 'api key')
      ),
      new TracePayloadEncoder(clock, createConfiguration(), resourceAttributesSource)
    )

    batchProcessor.add(createEndedSpan())

    delivery.setNextSamplingProbability(0.0)

    expect(sampler.probability).toBe(1.0)

    await batchProcessor.flush()

    expect(sampler.probability).toBe(0.0)
    expect(delivery.requests).toHaveLength(1)
  })

  it('discards ended spans if samplingRate is higher than the samplingProbability', async () => {
    const delivery = new InMemoryDelivery()
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const persistence = new InMemoryPersistence()
    await persistence.save('bugsnag-sampling-probability', { value: 0.5, time: Date.now() })

    const sampler = new Sampler(0.5)
    const batchProcessor = new BatchProcessor(
      delivery,
      createConfiguration(),
      { add: jest.fn(), flush: jest.fn() },
      sampler,
      await ProbabilityManager.create(
        persistence,
        sampler,
        new ProbabilityFetcher(delivery, 'api key')
      ),
      new TracePayloadEncoder(clock, createConfiguration(), resourceAttributesSource)
    )

    const span1 = createEndedSpan({
      name: 'Span 01',
      samplingRate: Math.floor(0.75 * 0xffffffff),
      samplingProbability: sampler.spanProbability
    })

    const span2 = createEndedSpan({
      name: 'Span 02',
      samplingRate: Math.floor(0.25 * 0xffffffff),
      samplingProbability: sampler.spanProbability
    })

    batchProcessor.add(span1)
    batchProcessor.add(span2)

    await batchProcessor.flush()

    expect(delivery).not.toHaveSentSpan(expect.objectContaining({
      name: 'Span 01'
    }))

    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: 'Span 02'
    }))

    expect(delivery.requests).toHaveLength(1)
  })

  it('does not send a request if the entire batch is discarded', async () => {
    const delivery = new InMemoryDelivery()
    const clock = new IncrementingClock('1970-01-01T00:00:00Z')
    const persistence = new InMemoryPersistence()
    await persistence.save('bugsnag-sampling-probability', { value: 0.5, time: Date.now() })

    const sampler = new Sampler(0.5)
    const batchProcessor = new BatchProcessor(
      delivery,
      createConfiguration(),
      { add: jest.fn(), flush: jest.fn() },
      sampler,
      await ProbabilityManager.create(
        persistence,
        sampler,
        new ProbabilityFetcher(delivery, 'api key')
      ),
      new TracePayloadEncoder(clock, createConfiguration(), resourceAttributesSource)
    )

    const span1 = createEndedSpan({
      name: 'Span 01',
      samplingRate: Math.floor(0.75 * 0xffffffff),
      samplingProbability: sampler.spanProbability
    })

    const span2 = createEndedSpan({
      name: 'Span 02',
      samplingRate: Math.floor(0.75 * 0xffffffff),
      samplingProbability: sampler.spanProbability
    })

    batchProcessor.add(span1)
    batchProcessor.add(span2)

    await batchProcessor.flush()

    expect(delivery).not.toHaveSentSpan(expect.objectContaining({
      name: 'Span 01'
    }))

    expect(delivery).not.toHaveSentSpan(expect.objectContaining({
      name: 'Span 02'
    }))

    expect(delivery.requests).toHaveLength(0)
  })
})
