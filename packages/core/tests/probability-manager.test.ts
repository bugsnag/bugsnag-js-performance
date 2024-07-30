import ProbabilityManager from '../lib/probability-manager'
import ProbabilityFetcher from '../lib/probability-fetcher'
import Sampler from '../lib/sampler'
import { InMemoryPersistence } from '../lib/persistence'
import { InMemoryDelivery } from '@bugsnag/js-performance-test-utilities'

jest.useFakeTimers()

describe('ProbabilityManager', () => {
  it('uses the configured probability if there is no persisted value', async () => {
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

    await jest.advanceTimersByTimeAsync(1)
    expect(delivery.samplingRequests).toHaveLength(0)

    expect(await persistence.load('bugsnag-sampling-probability')).toBeUndefined()
  })

  it('uses the persisted probability if the persisted value is too old', async () => {
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

    await jest.runOnlyPendingTimersAsync()
    expect(delivery.samplingRequests).toHaveLength(0)
  })

  it('uses the persisted probability if the persisted value is recent', async () => {
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

    await jest.runOnlyPendingTimersAsync()
    expect(delivery.samplingRequests).toHaveLength(0)
  })

  it('persists new probability values', async () => {
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

    await jest.runOnlyPendingTimersAsync()
    expect(delivery.samplingRequests).toHaveLength(0)
  })

  describe('ensureFreshProbability', () => {
    it('does nothing if the probability has just been set', async () => {
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
      await manager.ensureFreshProbability()

      // we've just set a probability value so shouldn't make a sampling request
      await jest.runOnlyPendingTimersAsync()
      expect(delivery.samplingRequests).toHaveLength(0)
    })

    it('does nothing if the probability is less than 24 hours old', async () => {
      const persistence = new InMemoryPersistence()
      persistence.save('bugsnag-sampling-probability', {
        value: 0.25,
        time: Date.now() - 24 * 60 * 60 * 1000 + 1 // 23 hours 59 minutes & 59 seconds ago
      })

      const delivery = new InMemoryDelivery()
      delivery.setNextSamplingProbability(0.5)

      const sampler = new Sampler(0.75)
      const fetcher = new ProbabilityFetcher(delivery, 'api key')

      const manager = await ProbabilityManager.create(
        persistence,
        sampler,
        fetcher
      )

      await manager.ensureFreshProbability()

      // the persisted probability value is fresh enough so we shouldn't make a
      // sampling request
      await jest.runOnlyPendingTimersAsync()
      expect(delivery.samplingRequests).toHaveLength(0)
    })

    it('fetches a new probability if the probability is stale', async () => {
      const persistence = new InMemoryPersistence()
      persistence.save('bugsnag-sampling-probability', {
        value: 0.25,
        time: Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
      })

      const delivery = new InMemoryDelivery()
      delivery.setNextSamplingProbability(0.5)

      const sampler = new Sampler(0.75)
      const fetcher = new ProbabilityFetcher(delivery, 'api key')

      const manager = await ProbabilityManager.create(
        persistence,
        sampler,
        fetcher
      )

      expect(delivery.samplingRequests).toHaveLength(0)

      await manager.ensureFreshProbability()

      // the persisted probability value is stale so we should make a request
      expect(delivery.samplingRequests).toHaveLength(1)
    })

    it('does not make a second request if one is already underway', async () => {
      const persistence = new InMemoryPersistence()
      persistence.save('bugsnag-sampling-probability', {
        value: 0.25,
        time: Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
      })

      const delivery = new InMemoryDelivery()
      delivery.setNextSamplingProbability(0.5)

      const sampler = new Sampler(0.75)
      const fetcher = new ProbabilityFetcher(delivery, 'api key')

      const manager = await ProbabilityManager.create(
        persistence,
        sampler,
        fetcher
      )

      expect(delivery.samplingRequests).toHaveLength(0)

      await Promise.all([
        manager.ensureFreshProbability(),
        manager.ensureFreshProbability(),
        manager.ensureFreshProbability(),
        manager.ensureFreshProbability()
      ])

      // the persisted probability value is stale so we should make a request
      expect(delivery.samplingRequests).toHaveLength(1)
    })
  })
})
