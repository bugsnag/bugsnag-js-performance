/**
 * @jest-environment jsdom
 * @jest-environment-options { "url": "https://bugsnag.com/browser-integration-tests" }
*/

import { VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'
import BugsnagPerformance from '../lib/browser'

// eslint-disable-next-line jest/no-mocks-import
import { mockFetch, requests, setNextSamplingProbability } from './__mocks__/@bugsnag/delivery-fetch-performance'

jest.useFakeTimers()

describe('Browser client integration tests', () => {
  describe('Sampling', () => {
    it('(potential flake) uses the sampling header from the response for the next batch', async () => {
      setNextSamplingProbability(0.999999)

      BugsnagPerformance.start({
        apiKey: VALID_API_KEY,
        endpoint: '/test',
        autoInstrumentFullPageLoads: false
      })

      // Advance to next tick
      await jest.advanceTimersByTimeAsync(1)

      // Check for initial sampling request
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/test', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          resourceSpans: []
        })
      }))

      // Create and end span and await batch timeout
      BugsnagPerformance.startSpan('test span').end()

      await jest.advanceTimersByTimeAsync(30000)

      expect(mockFetch).toHaveBeenCalledTimes(2)

      const deliveredSpan = requests[1].resourceSpans[0].scopeSpans[0].spans[0]
      expect(deliveredSpan.attributes).toContainEqual({ key: 'bugsnag.sampling.p', value: { doubleValue: 0.999999 } })
    })
  })
})
