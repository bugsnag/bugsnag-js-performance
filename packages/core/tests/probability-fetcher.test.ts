import ProbabilityFetcher from '../lib/probability-fetcher'
import { InMemoryDelivery } from '@bugsnag/js-performance-test-utilities'

jest.useFakeTimers()

describe('ProbabilityFetcher', () => {
  it('returns probability when delivery returns a value immediately', async () => {
    const delivery = new InMemoryDelivery()
    delivery.setNextSamplingProbability(0.25)

    const fetcher = new ProbabilityFetcher(delivery)
    const probability = await fetcher.getNewProbability()

    expect(probability).toBe(0.25)
  })

  it('returns probability when delivery returns 0.0', async () => {
    const delivery = new InMemoryDelivery()
    delivery.setNextSamplingProbability(0.0)

    const fetcher = new ProbabilityFetcher(delivery)
    const probability = await fetcher.getNewProbability()

    expect(probability).toBe(0.0)
  })

  it('retries if delivery fails until a new probability is retrieved', async () => {
    const delivery = new InMemoryDelivery()
    const fetcher = new ProbabilityFetcher(delivery)

    const fetcherPromise = fetcher.getNewProbability()

    // 1 request is made immediately, but no sampling probability is returned
    expect(delivery.samplingRequests).toHaveLength(1)

    // after 30 seconds another request should be made
    await jest.advanceTimersByTimeAsync(30_000)
    expect(delivery.samplingRequests).toHaveLength(2)

    // etc..
    await jest.advanceTimersByTimeAsync(30_000)
    expect(delivery.samplingRequests).toHaveLength(3)

    // etc..
    await jest.advanceTimersByTimeAsync(30_000)
    expect(delivery.samplingRequests).toHaveLength(4)

    // when a probability is returned, the promise should resolve to its value
    delivery.setNextSamplingProbability(0.75)
    await jest.advanceTimersByTimeAsync(30_000)

    expect(await fetcherPromise).toBe(0.75)
  })
})
