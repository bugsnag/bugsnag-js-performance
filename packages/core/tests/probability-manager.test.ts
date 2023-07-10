import ProbabilityManager from '../lib/probability-manager'
import ProbabilityFetcher from '../lib/probability-fetcher'
import Sampler from '../lib/sampler'
import { InMemoryPersistence } from '../lib/persistence'
import { InMemoryDelivery } from '@bugsnag/js-performance-test-utilities'

jest.useFakeTimers()

describe('ProbabilityManager', () => {
  it('uses the configured probability and fetches a new one immediately if there is no persisted value', async () => {
    const persistence = new InMemoryPersistence()
    const delivery = new InMemoryDelivery()
    delivery.setNextSamplingProbability(0.5)

    const sampler = new Sampler(0.75)
    const fetcher = new ProbabilityFetcher(delivery, 'api key')

    await ProbabilityManager.create(
      persistence,
      sampler,
      fetcher
    )

    expect(sampler.probability).toBe(1.0)

    // the configured probability should not be persisted
    expect(await persistence.load('bugsnag-sampling-probability')).toBeUndefined()

    // a request will only be made after a macro task
    expect(delivery.samplingRequests).toHaveLength(0)

    await jest.advanceTimersByTimeAsync(1)
    expect(delivery.samplingRequests).toHaveLength(1)

    // the value fetched from the server should be persisted
    expect(await persistence.load('bugsnag-sampling-probability')).toStrictEqual({
      value: 0.5,
      // the time will be 1ms ago as jest's timer has advanced 1ms after the
      // persistence happened
      time: Date.now() - 1
    })

    // after 1 day, another request should be made
    await jest.advanceTimersByTimeAsync((24 * 60 * 60 * 1000) - 2)
    expect(delivery.samplingRequests).toHaveLength(1)

    await jest.advanceTimersByTimeAsync(1)
    expect(delivery.samplingRequests).toHaveLength(2)
  })

  it('uses the persisted probability and fetches a new one immediately if the persisted value is too old', async () => {
    const persistence = new InMemoryPersistence()
    persistence.save('bugsnag-sampling-probability', {
      value: 0.25,
      time: 0
    })

    const delivery = new InMemoryDelivery()
    delivery.setNextSamplingProbability(0.5)

    const sampler = new Sampler(0.5)
    const fetcher = new ProbabilityFetcher(delivery, 'api key')

    await ProbabilityManager.create(
      persistence,
      sampler,
      fetcher
    )

    expect(sampler.probability).toBe(0.25)

    // a request will only be made after a macro task
    expect(delivery.samplingRequests).toHaveLength(0)

    await jest.advanceTimersByTimeAsync(1)
    expect(delivery.samplingRequests).toHaveLength(1)

    // the value fetched from the server should be persisted
    expect(await persistence.load('bugsnag-sampling-probability')).toStrictEqual({
      value: 0.5,
      // the time will be 1ms ago as jest's timer has advanced 1ms after the
      // persistence happened
      time: Date.now() - 1
    })

    // after 1 day, another request should be made
    await jest.advanceTimersByTimeAsync((24 * 60 * 60 * 1000) - 2)
    expect(delivery.samplingRequests).toHaveLength(1)

    await jest.advanceTimersByTimeAsync(1)
    expect(delivery.samplingRequests).toHaveLength(2)
  })

  it('uses the persisted probability and fetches a new one when it expires if the persisted value is recent', async () => {
    const persistence = new InMemoryPersistence()
    persistence.save('bugsnag-sampling-probability', {
      value: 0.25,
      time: Date.now() - 30_000 // 30 seconds ago
    })

    const delivery = new InMemoryDelivery()
    delivery.setNextSamplingProbability(0.5)

    const sampler = new Sampler(0.5)
    const fetcher = new ProbabilityFetcher(delivery, 'api key')

    await ProbabilityManager.create(
      persistence,
      sampler,
      fetcher
    )

    expect(sampler.probability).toBe(0.25)

    // a request should not be made until the probability expires
    await jest.advanceTimersByTimeAsync(1)
    expect(delivery.samplingRequests).toHaveLength(0)

    // after 1 day - 30 seconds, another request should be made
    await jest.advanceTimersByTimeAsync((24 * 60 * 60 * 1000) - 30_000 - 2)
    expect(delivery.samplingRequests).toHaveLength(0)

    await jest.advanceTimersByTimeAsync(1)
    expect(delivery.samplingRequests).toHaveLength(1)

    // the value fetched from the server should be persisted
    expect(await persistence.load('bugsnag-sampling-probability')).toStrictEqual({
      value: 0.5,
      time: Date.now()
    })
  })

  it('persists new probability values and fetches a new one after they expire', async () => {
    const persistence = new InMemoryPersistence()
    const delivery = new InMemoryDelivery()
    delivery.setNextSamplingProbability(0.5)

    const sampler = new Sampler(0.75)
    const fetcher = new ProbabilityFetcher(delivery, 'api key')

    const manager = await ProbabilityManager.create(
      persistence,
      sampler,
      fetcher
    )

    await manager.setProbability(0.25)

    // the new probability should be persisted
    expect(await persistence.load('bugsnag-sampling-probability')).toStrictEqual({
      value: 0.25,
      time: Date.now()
    })

    expect(delivery.samplingRequests).toHaveLength(0)

    // after 1 day a request for a new probability should be made
    await jest.advanceTimersByTimeAsync((24 * 60 * 60 * 1000) - 1)
    expect(delivery.samplingRequests).toHaveLength(0)

    await jest.advanceTimersByTimeAsync(1)
    expect(delivery.samplingRequests).toHaveLength(1)
  })

  it('refreshes the expiration timer when a new probability is set', async () => {
    const persistence = new InMemoryPersistence()
    const delivery = new InMemoryDelivery()
    delivery.setNextSamplingProbability(0.5)

    const sampler = new Sampler(0.75)
    const fetcher = new ProbabilityFetcher(delivery, 'api key')

    const manager = await ProbabilityManager.create(
      persistence,
      sampler,
      fetcher
    )

    await manager.setProbability(0.25)

    // the new probability should be persisted
    expect(await persistence.load('bugsnag-sampling-probability')).toStrictEqual({
      value: 0.25,
      time: Date.now()
    })

    expect(delivery.samplingRequests).toHaveLength(0)

    // wait just less than 1 day
    await jest.advanceTimersByTimeAsync((24 * 60 * 60 * 1000) - 1)
    expect(delivery.samplingRequests).toHaveLength(0)

    await manager.setProbability(0.8)

    expect(await persistence.load('bugsnag-sampling-probability')).toStrictEqual({
      value: 0.8,
      time: Date.now()
    })

    // as we just set a new probability, a request shouldn't be made
    await jest.advanceTimersByTimeAsync(1)
    expect(delivery.samplingRequests).toHaveLength(0)

    // wait just less than 1 day again (we've already just waited 1 ms above)
    await jest.advanceTimersByTimeAsync((24 * 60 * 60 * 1000) - 2)
    expect(delivery.samplingRequests).toHaveLength(0)

    // now the probability we just set has expired, so we should refresh it from
    // the server
    await jest.advanceTimersByTimeAsync(1)
    expect(delivery.samplingRequests).toHaveLength(1)
  })
})
