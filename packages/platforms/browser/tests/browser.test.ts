/**
 * @jest-environment jsdom
 * @jest-environment-options { "url": "https://bugsnag.com/browser-integration-tests" }
*/

/* eslint-disable @typescript-eslint/no-var-requires */

import { VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'
import type { BrowserConfiguration } from '../lib/config'
import type { Client } from '@bugsnag/core-performance'
import type Bugsnag from '@bugsnag/browser'

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
let bugsnag: typeof Bugsnag

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
  jest.isolateModules(() => {
    mockFetch = createMockFetch()
    window.fetch = mockFetch

    client = require('../lib/browser').default
    bugsnag = require('@bugsnag/browser').default
  })

  localStorage.removeItem('bugsnag-sampling-probability')
})

describe('Browser client integration tests', () => {
  describe('Batching', () => {
    it('waits for the initial sampling request to complete before sending the first batch', async () => {
      setNextSamplingProbability(0.1234)

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

      // Header should be updated
      expect(mockFetch).toHaveBeenLastCalledWith('/test', expect.objectContaining({
        headers: expect.objectContaining({
          'Bugsnag-Span-Sampling': expect.stringMatching(/^0\.1234:\d+$/)
        })
      }))

      const samplingHeaderParser = /^(?<probability>0\.\d+):(?<numberOfSpans>\d+)$/
      const samplingHeader = mockFetch.mock.calls[1][1].headers['Bugsnag-Span-Sampling']
      const matches = samplingHeaderParser.exec(samplingHeader)
      expect(matches?.groups?.probability).toEqual('0.1234')

      const numberOfSpans = Number.parseInt(matches?.groups?.numberOfSpans || '0')
      expect(numberOfSpans).toBeGreaterThan(0)
      expect(numberOfSpans).toBeLessThanOrEqual(100)

      expect(fullBatch.resourceSpans[0].scopeSpans[0].spans).toHaveLength(numberOfSpans)

      // Every span should have the sampling probability returned by the initial sampling request
      for (const span of fullBatch.resourceSpans[0].scopeSpans[0].spans) {
        expect(span.attributes).toContainEqual({ key: 'bugsnag.sampling.p', value: { doubleValue: 0.1234 } })
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

      setNextSamplingProbability(0.2)

      // Create one full batch
      createSpans(100)

      await jest.runOnlyPendingTimersAsync()

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch.mock.calls[1][1]).toEqual(expect.objectContaining({
        headers: expect.objectContaining({ 'Bugsnag-Span-Sampling': expect.stringMatching(/^0\.2:\d+$/) })
      }))

      const samplingHeaderParser = /^(?<probability>0\.\d+):(?<numberOfSpans>\d+)$/
      const samplingHeader1 = mockFetch.mock.calls[1][1].headers['Bugsnag-Span-Sampling']
      const matches1 = samplingHeaderParser.exec(samplingHeader1)
      expect(matches1?.groups?.probability).toEqual('0.2')

      const numberOfSpans1 = Number.parseInt(matches1?.groups?.numberOfSpans || '0')
      expect(numberOfSpans1).toBeGreaterThan(0)
      expect(numberOfSpans1).toBeLessThanOrEqual(100)

      // make a second batch with a different probability value
      setNextSamplingProbability(0.5)
      await jest.runOnlyPendingTimersAsync()
      createSpans(100)
      await jest.runOnlyPendingTimersAsync()

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(mockFetch.mock.calls[2][1]).toEqual(expect.objectContaining({
        headers: expect.objectContaining({ 'Bugsnag-Span-Sampling': expect.stringMatching(/^0\.5:\d+$/) })
      }))

      const samplingHeader2 = mockFetch.mock.calls[2][1].headers['Bugsnag-Span-Sampling']
      const matches2 = samplingHeaderParser.exec(samplingHeader2)
      expect(matches2?.groups?.probability).toEqual('0.5')

      const numberOfSpans2 = Number.parseInt(matches2?.groups?.numberOfSpans || '0')
      expect(numberOfSpans2).toBeGreaterThan(0)
      expect(numberOfSpans2).toBeLessThanOrEqual(100)

      await jest.runOnlyPendingTimersAsync()
    })
  })

  describe('Error Correlation', () => {
    it('adds correlation metadata to error reports', async () => {
      jest.spyOn(console, 'debug').mockImplementation(() => {})

      const errorClient = bugsnag.start({
        apiKey: VALID_API_KEY,
        autoTrackSessions: false,
        endpoints: {
          notify: '/test',
          sessions: '/test'
        }
      })

      const sendEvent = jest.fn()

      // @ts-expect-error _delivery api is hidden from the public API
      errorClient._delivery = {
        sendSession: jest.fn(),
        sendEvent
      }

      client.start({
        apiKey: VALID_API_KEY,
        endpoint: '/test',
        autoInstrumentFullPageLoads: false,
        autoInstrumentNetworkRequests: false,
        autoInstrumentRouteChanges: false,
        bugsnag: errorClient
      })

      await jest.runOnlyPendingTimersAsync()
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/test', emptySamplingRequest)

      const span = client.startSpan('test span')

      bugsnag.notify(new Error('test error'))

      expect(sendEvent).toHaveBeenCalledTimes(1)
      expect(sendEvent.mock.calls[0][0].events[0]._correlation).toEqual({
        traceId: span.traceId,
        spanId: span.id
      })

      span.end()

      await jest.runOnlyPendingTimersAsync()
    })

    it('does not add correlation metadata to error reports when no span is active', async () => {
      jest.spyOn(console, 'debug').mockImplementation(() => {})

      const errorClient = bugsnag.start({
        apiKey: VALID_API_KEY,
        autoTrackSessions: false,
        endpoints: {
          notify: '/test',
          sessions: '/test'
        }
      })

      const sendEvent = jest.fn()

      // @ts-expect-error _delivery api is hidden from the public API
      errorClient._delivery = {
        sendSession: jest.fn(),
        sendEvent
      }

      client.start({
        apiKey: VALID_API_KEY,
        endpoint: '/test',
        autoInstrumentFullPageLoads: false,
        autoInstrumentNetworkRequests: false,
        autoInstrumentRouteChanges: false,
        bugsnag: errorClient
      })

      await jest.runOnlyPendingTimersAsync()
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/test', emptySamplingRequest)

      const span = client.startSpan('test span')

      span.end()

      bugsnag.notify(new Error('test error'))

      expect(sendEvent).toHaveBeenCalledTimes(1)
      expect(sendEvent.mock.calls[0][0].events[0]._correlation).toBeUndefined()

      await jest.runOnlyPendingTimersAsync()
    })

    it('adds the span and trace id from the parent span', async () => {
      jest.spyOn(console, 'debug').mockImplementation(() => {})

      const errorClient = bugsnag.start({
        apiKey: VALID_API_KEY,
        autoTrackSessions: false,
        endpoints: {
          notify: '/test',
          sessions: '/test'
        }
      })

      const sendEvent = jest.fn()

      // @ts-expect-error _delivery api is hidden from the public API
      errorClient._delivery = {
        sendSession: jest.fn(),
        sendEvent
      }

      client.start({
        apiKey: VALID_API_KEY,
        endpoint: '/test',
        autoInstrumentFullPageLoads: false,
        autoInstrumentNetworkRequests: false,
        autoInstrumentRouteChanges: false,
        bugsnag: errorClient
      })

      await jest.runOnlyPendingTimersAsync()
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/test', emptySamplingRequest)

      const parentSpan = client.startSpan('parent span')

      await jest.advanceTimersByTimeAsync(500)

      const childSpan = client.startSpan('child span', { makeCurrentContext: false })

      bugsnag.notify(new Error('test error'))

      expect(sendEvent).toHaveBeenCalledTimes(1)
      expect(sendEvent.mock.calls[0][0].events[0]._correlation).toEqual({
        traceId: parentSpan.traceId,
        spanId: parentSpan.id
      })

      parentSpan.end()
      childSpan.end()

      await jest.runOnlyPendingTimersAsync()
    })
  })

  describe('payload checksum behavior (Bugsnag-Integrity header)', () => {
    beforeAll(() => {
      // eslint-disable-next-line compat/compat
      window.isSecureContext = true
    })

    afterAll(() => {
      // eslint-disable-next-line compat/compat
      window.isSecureContext = false
    })

    it('includes the integrity header by default', async () => {
      client.start({
        apiKey: VALID_API_KEY,
        autoInstrumentFullPageLoads: false,
        autoInstrumentNetworkRequests: false,
        autoInstrumentRouteChanges: false
      })

      setNextSamplingProbability(0.2)
      createSpans(100)
      await jest.advanceTimersByTimeAsync(RESPONSE_TIME + 1)
      expect(mockFetch).toHaveBeenCalledTimes(2)

      expect(mockFetch.mock.calls[1][1]).toEqual(expect.objectContaining({
        headers: expect.objectContaining({ 'Bugsnag-Integrity': expect.stringMatching(/^sha1 (\d|[abcdef]){40}$/) })
      }))
    })

    it('does not include the integrity header if endpoint configuration is supplied', async () => {
      client.start({
        apiKey: VALID_API_KEY,
        endpoint: '/test',
        autoInstrumentFullPageLoads: false,
        autoInstrumentNetworkRequests: false,
        autoInstrumentRouteChanges: false
      })

      setNextSamplingProbability(0.2)
      createSpans(100)
      await jest.advanceTimersByTimeAsync(RESPONSE_TIME + 1)
      expect(mockFetch).toHaveBeenCalledTimes(2)

      expect(mockFetch.mock.calls[1][1]).toEqual(expect.objectContaining({
        headers: expect.not.objectContaining({ 'Bugsnag-Integrity': expect.any(String) })
      }))
    })

    it('can be enabled for a custom endpoint configuration by using sendPayloadChecksums', async () => {
      client.start({
        apiKey: VALID_API_KEY,
        endpoint: '/test',
        sendPayloadChecksums: true,
        autoInstrumentFullPageLoads: false,
        autoInstrumentNetworkRequests: false,
        autoInstrumentRouteChanges: false
      })

      setNextSamplingProbability(0.2)
      createSpans(100)
      await jest.advanceTimersByTimeAsync(RESPONSE_TIME + 1)
      expect(mockFetch).toHaveBeenCalledTimes(2)

      expect(mockFetch.mock.calls[1][1]).toEqual(expect.objectContaining({
        headers: expect.objectContaining({ 'Bugsnag-Integrity': expect.stringMatching(/^sha1 (\d|[abcdef]){40}$/) })
      }))
    })
  })
})
