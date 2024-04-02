import {
  responseStateFromStatusCode,
  type BackgroundingListener,
  type Clock,
  type Delivery,
  type DeliveryFactory,
  type DeliveryPayload,
  type TracePayload
} from '@bugsnag/core-performance'

export const requests: DeliveryPayload[] = []

type Fetch = typeof fetch

// manually mock response
const response = {
  status: 200,
  headers: new Headers({ 'Bugsnag-Sampling-Probability': '1.0' })
}

export const setNextSamplingProbability = (probability: number) => {
  const newProbability = probability.toString()
  response.headers.set('Bugsnag-Sampling-Probability', newProbability)
}

export const mockFetch = jest.fn((endpoint: string, options) => Promise.resolve(response))

function samplingProbabilityFromHeaders (headers: Headers): number | undefined {
  const value = headers.get('Bugsnag-Sampling-Probability')

  if (typeof value !== 'string') {
    return undefined
  }

  const asNumber = Number.parseFloat(value)

  if (Number.isNaN(asNumber) || asNumber < 0 || asNumber > 1) {
    return undefined
  }

  return asNumber
}

function createFetchDeliveryFactory (
  fetch: Fetch,
  clock: Clock,
  backgroundingListener?: BackgroundingListener
): DeliveryFactory {
  return function fetchDeliveryFactory (endpoint: string): Delivery {
    return {
      async send (payload: TracePayload) {
        requests.push({ resourceSpans: payload.body.resourceSpans })

        const body = JSON.stringify(payload.body)

        payload.headers['Bugsnag-Sent-At'] = clock.date().toISOString()

        try {
          const response = await mockFetch(endpoint, {
            method: 'POST',
            keepalive: false,
            body,
            headers: payload.headers
          })

          return {
            state: responseStateFromStatusCode(response.status),
            samplingProbability: samplingProbabilityFromHeaders(response.headers)
          }
        } catch (err) {
          if (body.length > 10e5) {
            return { state: 'failure-discard' }
          }

          return { state: 'failure-retryable' }
        }
      }
    }
  }
}

export default createFetchDeliveryFactory
