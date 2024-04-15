/**
 * @jest-environment jsdom
 * @jest-environment-options { "url": "https://bugsnag.com/browser-integration-tests" }
*/

import { VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'
import BugsnagPerformance from '../lib/browser'

// eslint-disable-next-line jest/no-mocks-import
import { mockFetch, setNextSamplingProbability } from './__mocks__/@bugsnag/delivery-fetch-performance'

jest.useFakeTimers()

beforeEach(() => {
  mockFetch.mockClear()
  setNextSamplingProbability(1.0)
})

describe('Browser client integration tests', () => {
  describe('Batching', () => {
    it('waits for the initial sampling request to complete before sending the first batch', async () => {
      setNextSamplingProbability(0.999999)

      // Fill a batch before starting bugsnag
      createSpans(100)
      await jest.advanceTimersByTimeAsync(30000)
      expect(mockFetch).toHaveBeenCalledTimes(0)

      BugsnagPerformance.start({
        apiKey: VALID_API_KEY,
        endpoint: '/test',
        autoInstrumentFullPageLoads: false
      })

      await nextTickAsync()
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/test', emptySamplingRequest)

      // Await the initial sampling request to complete
      await jest.advanceTimersByTimeAsync(100)
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Second request should be the full batch
      const fullBatch = JSON.parse(mockFetch.mock.calls[1][1].body)
      expect(fullBatch.resourceSpans[0].scopeSpans[0].spans).toHaveLength(100)

      // Header should be updated
      expect(mockFetch).toHaveBeenLastCalledWith('/test', expect.objectContaining({
        headers: expect.objectContaining({
          'Bugsnag-Span-Sampling': '0.999999:100'
        })
      }))

      // Every span should have the sampling probability returned by the initial sampling request
      for (const span of fullBatch.resourceSpans[0].scopeSpans[0].spans) {
        expect(span.attributes).toContainEqual({ key: 'bugsnag.sampling.p', value: { doubleValue: 0.999999 } })
      }
    })
  })

  describe('Resampling', () => {
    it('uses the incoming sampling probability for the next batch', async () => {
      expect(mockFetch).toHaveBeenCalledTimes(0)

      setNextSamplingProbability(0.999998)

      // One full batch and one almost complete batch
      createSpans(199)

      await nextTickAsync()
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch.mock.calls[0][1]).toEqual(expect.objectContaining({
        headers: expect.objectContaining({ 'Bugsnag-Span-Sampling': '0.999999:100' })
      }))

      // Await probability update
      await jest.advanceTimersByTimeAsync(100)

      // Complete second batch
      createSpans(1)
      await nextTickAsync()

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch.mock.calls[1][1]).toEqual(expect.objectContaining({
        headers: expect.objectContaining({ 'Bugsnag-Span-Sampling': '0.999998:100' })
      }))
    })
  })
})

const emptySamplingRequest = {
  body: '{"resourceSpans":[]}',
  headers: {
    'Bugsnag-Api-Key': VALID_API_KEY,
    'Bugsnag-Sent-At': expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/),
    'Bugsnag-Span-Sampling': '1.0:0',
    'Content-Type': 'application/json'
  },
  keepalive: false,
  method: 'POST'
}

const createSpans = (count: number) => {
  for (let i = 0; i < count; i++) {
    const span = BugsnagPerformance.startSpan(`span ${i}`)
    span.end()
  }
}

const nextTickAsync = async () => {
  await jest.advanceTimersByTimeAsync(1)
}
