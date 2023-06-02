import Sampler from '../lib/sampler'
import { InMemoryDelivery, createEndedSpan } from '@bugsnag/js-performance-test-utilities'

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
    expect(delivery.requests[0]).toEqual({ resourceSpans: [] })
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
})
