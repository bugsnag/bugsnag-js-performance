import {
  type BackgroundingListener,
  type Clock,
  type Delivery,
  type DeliveryFactory,
  type TracePayload,
  responseStateFromStatusCode
} from '@bugsnag/core-performance'

export type Fetch = typeof fetch

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
  backgroundingListener: BackgroundingListener,
  clock: Clock
): DeliveryFactory {
  // we set fetch's 'keepalive' flag if the app is backgrounded/terminated so
  // that we can flush the last batch - without 'keepalive' a browser may
  // cancel (or never start sending) this request
  // we don't _always_ set the flag because it imposes a 64k payload limit
  let keepalive = false

  backgroundingListener.onStateChange(state => {
    keepalive = state === 'in-background'
  })

  return function fetchDeliveryFactory (endpoint: string): Delivery {
    return {
      async send (payload: TracePayload) {
        const body = JSON.stringify(payload.body)

        payload.headers['Bugsnag-Sent-At'] = clock.date().toISOString()

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            keepalive,
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
