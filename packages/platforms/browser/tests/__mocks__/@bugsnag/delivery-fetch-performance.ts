import {
  responseStateFromStatusCode,
  type BackgroundingListener,
  type Clock,
  type Delivery,
  type DeliveryFactory,
  type TracePayload
} from '@bugsnag/core-performance'

type Fetch = typeof fetch

const response = {
  status: 200,
  headers: new Headers({ 'Bugsnag-Sampling-Probability': '1.0' })
}

export const mockFetch = jest.fn().mockImplementation(() => new Promise((resolve) => {
  setTimeout(() => {
    resolve(response)
  }, 100)
}))

export const setNextSamplingProbability = (probability: number) => {
  response.headers.set('Bugsnag-Sampling-Probability', probability.toString())
}

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
