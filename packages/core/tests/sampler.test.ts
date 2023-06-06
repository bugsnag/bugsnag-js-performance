import Sampler from '../lib/sampler'
import { InMemoryDelivery, createEndedSpan } from '@bugsnag/js-performance-test-utilities'
import { type ResponseState } from '../lib'

jest.useFakeTimers()

describe('Sampler', () => {
  it('uses the initial probability', () => {
    const sampler = new Sampler(1.0)

    expect(sampler.probability).toBe(1.0)
  })

  it('uses the probability when set', () => {
    const sampler = new Sampler(1.0)
    sampler.probability = 0.25

    expect(sampler.probability).toBe(0.25)
  })

  describe('initialise', () => {
    it('uses the provided probability when initialised', () => {
      const sampler = new Sampler(1.0)
      const delivery = new InMemoryDelivery()
      sampler.initialise(0.5, delivery)
      expect(sampler.probability).toBe(0.5)
    })

    it('makes an initial probability request when initialised', () => {
      const sampler = new Sampler(1.0)
      const delivery = new InMemoryDelivery()
      sampler.initialise(0.5, delivery)
      expect(delivery.samplingRequests.length).toEqual(1)
    })
  })

  describe('sample', () => {
    it('returns true when the samplingRate should be sampled with initial probability', () => {
      const sampler = new Sampler(0.75)
      const span = createEndedSpan({
        samplingRate: Math.floor(0.5 * 0xffffffff),
        samplingProbability: sampler.spanProbability
      })

      expect(sampler.sample(span)).toBe(true)
    })

    it('returns false when the samplingRate should not be sampled with initial probability', () => {
      const sampler = new Sampler(0.25)
      const span = createEndedSpan({
        samplingRate: Math.floor(0.5 * 0xffffffff),
        samplingProbability: sampler.spanProbability
      })

      expect(sampler.sample(span)).toBe(false)
    })

    it('returns true when the samplingRate should be sampled with a set probability', () => {
      const sampler = new Sampler(1.0)
      sampler.probability = 0.75

      const span = createEndedSpan({
        samplingRate: Math.floor(0.5 * 0xffffffff),
        samplingProbability: sampler.spanProbability
      })

      expect(sampler.sample(span)).toBe(true)
    })

    it('returns false when the samplingRate should not be sampled with a set probability', () => {
      const sampler = new Sampler(1.0)
      sampler.probability = 0.25

      const span = createEndedSpan({
        samplingRate: Math.floor(0.5 * 0xffffffff),
        samplingProbability: sampler.spanProbability
      })

      expect(sampler.sample(span)).toBe(false)
    })

    it.each([
      { probability: 1.0, rate: 1.0, expected: true },
      { probability: 1.0, rate: 0.9, expected: true },
      { probability: 1.0, rate: 0.8, expected: true },
      { probability: 1.0, rate: 0.7, expected: true },
      { probability: 1.0, rate: 0.6, expected: true },
      { probability: 1.0, rate: 0.5, expected: true },
      { probability: 1.0, rate: 0.4, expected: true },
      { probability: 1.0, rate: 0.3, expected: true },
      { probability: 1.0, rate: 0.2, expected: true },
      { probability: 1.0, rate: 0.1, expected: true },
      { probability: 1.0, rate: 0.0, expected: true },

      { probability: 0.9, rate: 1.0, expected: false },
      { probability: 0.8, rate: 1.0, expected: false },
      { probability: 0.7, rate: 1.0, expected: false },
      { probability: 0.6, rate: 1.0, expected: false },
      { probability: 0.5, rate: 1.0, expected: false },
      { probability: 0.4, rate: 1.0, expected: false },
      { probability: 0.3, rate: 1.0, expected: false },
      { probability: 0.2, rate: 1.0, expected: false },
      { probability: 0.1, rate: 1.0, expected: false },
      { probability: 0.0, rate: 1.0, expected: false },

      { probability: 0.9, rate: 0.75, expected: true },
      { probability: 0.8, rate: 0.75, expected: true },
      { probability: 0.7, rate: 0.75, expected: false },
      { probability: 0.6, rate: 0.75, expected: false },
      { probability: 0.5, rate: 0.75, expected: false },
      { probability: 0.4, rate: 0.75, expected: false },
      { probability: 0.3, rate: 0.75, expected: false },
      { probability: 0.2, rate: 0.75, expected: false },
      { probability: 0.1, rate: 0.75, expected: false },
      { probability: 0.0, rate: 0.75, expected: false },

      { probability: 0.9, rate: 0.5, expected: true },
      { probability: 0.8, rate: 0.5, expected: true },
      { probability: 0.7, rate: 0.5, expected: true },
      { probability: 0.6, rate: 0.5, expected: true },
      { probability: 0.5, rate: 0.5, expected: true },
      { probability: 0.4, rate: 0.5, expected: false },
      { probability: 0.3, rate: 0.5, expected: false },
      { probability: 0.2, rate: 0.5, expected: false },
      { probability: 0.1, rate: 0.5, expected: false },
      { probability: 0.0, rate: 0.5, expected: false },

      { probability: 0.9, rate: 0.25, expected: true },
      { probability: 0.8, rate: 0.25, expected: true },
      { probability: 0.7, rate: 0.25, expected: true },
      { probability: 0.6, rate: 0.25, expected: true },
      { probability: 0.5, rate: 0.25, expected: true },
      { probability: 0.4, rate: 0.25, expected: true },
      { probability: 0.3, rate: 0.25, expected: true },
      { probability: 0.2, rate: 0.25, expected: false },
      { probability: 0.1, rate: 0.25, expected: false },
      { probability: 0.0, rate: 0.25, expected: false },

      { probability: 0.9, rate: 0.0, expected: true },
      { probability: 0.8, rate: 0.0, expected: true },
      { probability: 0.7, rate: 0.0, expected: true },
      { probability: 0.6, rate: 0.0, expected: true },
      { probability: 0.5, rate: 0.0, expected: true },
      { probability: 0.4, rate: 0.0, expected: true },
      { probability: 0.3, rate: 0.0, expected: true },
      { probability: 0.2, rate: 0.0, expected: true },
      { probability: 0.1, rate: 0.0, expected: true },
      { probability: 0.0, rate: 0.0, expected: true }
    ])('returns $expected with { probability: $probability, rate: $rate }', ({ probability, rate, expected }) => {
      const sampler = new Sampler(1.0)
      sampler.probability = probability

      const span = createEndedSpan({
        samplingRate: Math.floor(rate * 0xffffffff),
        samplingProbability: sampler.spanProbability
      })

      expect(sampler.sample(span)).toBe(expected)
    })
  })

  describe('periodic sampling request', () => {
    it('requests a new sampling probability after 24 hours', async () => {
      const sampler = new Sampler(1.0)
      const delivery = new InMemoryDelivery()
      delivery.setNextSamplingProbability(0.5)
      sampler.initialise(1.0, delivery)

      // initial request
      expect(delivery.samplingRequests.length).toEqual(1)

      // allow the async request to complete
      await jest.advanceTimersByTimeAsync(0)
      expect(sampler.probability).toEqual(0.5)

      // just under 24 hours - no peridoic request yet
      await jest.advanceTimersByTimeAsync((24 * 60 * 60_000) - 1)
      expect(delivery.samplingRequests.length).toEqual(1)

      delivery.setNextSamplingProbability(0.25)

      // just over 24 hours - peridoic request sent
      await jest.advanceTimersByTimeAsync(2)
      expect(delivery.samplingRequests.length).toEqual(2)

      expect(sampler.probability).toEqual(0.25)
    })

    it('uses a requested probability when sampling the next batch', async () => {
      const sampler = new Sampler(1.0)
      const delivery = new InMemoryDelivery()
      delivery.setNextSamplingProbability(0.25)

      sampler.initialise(1.0, delivery)
      expect(delivery.samplingRequests.length).toEqual(1)

      // initial request
      await jest.advanceTimersByTimeAsync(0)
      expect(sampler.probability).toEqual(0.25)

      const span = createEndedSpan({
        samplingRate: Math.floor(0.5 * 0xffffffff),
        samplingProbability: sampler.spanProbability
      })

      expect(sampler.sample(span)).toEqual(false)
    })

    it('resets the timer when a probability value is set', async () => {
      const sampler = new Sampler(1.0)
      const delivery = new InMemoryDelivery()
      delivery.setNextSamplingProbability(0.5)
      sampler.initialise(1.0, delivery)

      // initial request
      expect(delivery.samplingRequests.length).toEqual(1)
      await jest.advanceTimersByTimeAsync(0)
      expect(sampler.probability).toEqual(0.5)

      // probability updated directly after 23 hours (should reset timer)
      await jest.advanceTimersByTimeAsync(82800000)
      sampler.probability = 0.75

      // 25 hours (2 hours since reset) - still no request
      await jest.advanceTimersByTimeAsync(7200000)
      expect(delivery.samplingRequests.length).toEqual(1)

      delivery.setNextSamplingProbability(0.25)

      // +22 hours (24 hours since reset) - peridoic request sent
      await jest.advanceTimersByTimeAsync(79200000)
      expect(delivery.samplingRequests.length).toEqual(2)

      // await Promise.resolve()
      expect(sampler.probability).toEqual(0.25)
    })

    it('retries the request after 30 seconds when samplingProbability is not defined', async () => {
      const sampler = new Sampler(1.0)
      const state: ResponseState = 'failure-retryable'
      const delivery = {
        send: jest.fn(() => {
          return Promise.resolve({ state })
        })
      }

      sampler.initialise(1.0, delivery)
      expect(delivery.send).toHaveBeenCalledTimes(1)

      await jest.advanceTimersByTimeAsync(29999)
      expect(delivery.send).toHaveBeenCalledTimes(1)

      await jest.advanceTimersByTimeAsync(30000)
      expect(delivery.send).toHaveBeenCalledTimes(2)
    })

    it('retries the request after 30 seconds when the request errors', async () => {
      const sampler = new Sampler(1.0)
      const delivery = {
        send: jest.fn(() => {
          return Promise.reject(new Error('request failed'))
        })
      }

      sampler.initialise(1.0, delivery)
      expect(delivery.send).toHaveBeenCalledTimes(1)

      await jest.advanceTimersByTimeAsync(29999)
      expect(delivery.send).toHaveBeenCalledTimes(1)

      await jest.advanceTimersByTimeAsync(30000)
      expect(delivery.send).toHaveBeenCalledTimes(2)
    })
  })
})
