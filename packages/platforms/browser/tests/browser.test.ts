/**
 * @jest-environment jsdom
 * @jest-environment-options { "url": "https://bugsnag.com/browser-integration-tests" }
*/

import { VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'
import BugsnagPerformance from '../lib/browser'

// eslint-disable-next-line jest/no-mocks-import
import { mockFetch, requests } from './__mocks__/@bugsnag/delivery-fetch-performance'

jest.useFakeTimers()

describe('Browser client integration tests', () => {
  describe('Batching', () => {
    it('waits for the initial sampling request to complete before sending the first batch', async () => {
      // Fill a batch before starting bugsnag
      for (let i = 0; i < 100; i++) {
        const span = BugsnagPerformance.startSpan(`span ${i}`)
        span.end()
      }

      expect(mockFetch).toHaveBeenCalledTimes(0)

      BugsnagPerformance.start({
        apiKey: VALID_API_KEY,
        endpoint: '/test',
        autoInstrumentFullPageLoads: false
      })

      // Advance to next tick
      await jest.advanceTimersByTimeAsync(1)
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Await the initial sampling request
      await jest.advanceTimersByTimeAsync(100)

      // First request should be the empty sampling request
      expect(requests[0].resourceSpans).toHaveLength(0)

      // wait for the full batch to be sent
      await jest.advanceTimersByTimeAsync(100)
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Second request should be the full batch
      expect(requests[1].resourceSpans[0].scopeSpans[0].spans).toHaveLength(100)
    })
  })
})
