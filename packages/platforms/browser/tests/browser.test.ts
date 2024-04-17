/**
 * @jest-environment jsdom
 * @jest-environment-options { "url": "https://bugsnag.com/browser-integration-tests" }
*/

import { VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'
import { type BrowserConfiguration } from '../lib/config'
import { type Client } from '@bugsnag/core-performance'

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
    const span = client.startSpan(`span ${i}`)
    span.end()
  }
}

let client: Client<BrowserConfiguration>

const response = {
  status: 200,
  headers: new Headers({ 'Bugsnag-Sampling-Probability': '1.0' })
}

const setNextSamplingProbability = (probability: number) => {
  response.headers.set('Bugsnag-Sampling-Probability', probability.toString())
}

const RESPONSE_TIME = 100

const createMockFetch = () => jest.fn().mockImplementation(() => new Promise((resolve) => {
  setTimeout(() => {
    resolve(response)
  }, RESPONSE_TIME)
}))

let mockFetch: ReturnType<typeof createMockFetch>

jest.useFakeTimers({ doNotFake: ['performance'] })

beforeEach(() => {
  setNextSamplingProbability(1.0)

  jest.isolateModules(() => {
    mockFetch = createMockFetch()
    window.fetch = mockFetch

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    client = require('../lib/browser').default
  })
})

describe('Browser client integration tests', () => {
  describe('Batching', () => {
    it('waits for the initial sampling request to complete before sending the first batch', async () => {
      setNextSamplingProbability(0.999999)

      // Fill a batch before starting bugsnag
      createSpans(100)

      client.start({
        apiKey: VALID_API_KEY,
        endpoint: '/test',
        autoInstrumentFullPageLoads: false,
        autoInstrumentNetworkRequests: false,
        autoInstrumentRouteChanges: false
      })

      await jest.advanceTimersByTimeAsync(1)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/test', emptySamplingRequest)

      // Initial sampling request will complete here
      await jest.advanceTimersByTimeAsync(RESPONSE_TIME)
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Second request delivered
      await jest.advanceTimersByTimeAsync(RESPONSE_TIME)
      const fullBatch = JSON.parse(mockFetch.mock.calls[1][1].body)
      expect(fullBatch.resourceSpans[0].scopeSpans[0].spans).toHaveLength(100)

      console.log(mockFetch.mock.calls[1][1].headers)

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
      client.start({
        apiKey: VALID_API_KEY,
        endpoint: '/test',
        autoInstrumentFullPageLoads: false,
        autoInstrumentNetworkRequests: false,
        autoInstrumentRouteChanges: false
      })

      await jest.runOnlyPendingTimersAsync()
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/test', emptySamplingRequest)

      // Initial sampling probability has been updated
      await jest.advanceTimersByTimeAsync(RESPONSE_TIME)

      setNextSamplingProbability(0.999999)

      // Create one full batch
      createSpans(100)

      await jest.advanceTimersByTimeAsync(1)
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch.mock.calls[1][1]).toEqual(expect.objectContaining({
        headers: expect.objectContaining({ 'Bugsnag-Span-Sampling': '1:100' })
      }))

      // Create a second almost complete batch
      createSpans(99)

      // Await delivery response and subsequent probability update
      await jest.advanceTimersByTimeAsync(RESPONSE_TIME)

      // Complete second batch
      createSpans(1)
      await jest.advanceTimersByTimeAsync(1)
      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(mockFetch.mock.calls[2][1]).toEqual(expect.objectContaining({
        headers: expect.objectContaining({ 'Bugsnag-Span-Sampling': '0.999999:100' })
      }))
    })
  })
})
