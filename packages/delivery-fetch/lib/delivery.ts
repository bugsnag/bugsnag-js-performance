import { responseStateFromStatusCode } from '@bugsnag/core-performance'
import type { BackgroundingListener, Clock, Delivery, DeliveryFactory, TracePayload } from '@bugsnag/core-performance'

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
  clock: Clock,
  backgroundingListener?: BackgroundingListener
): DeliveryFactory {
  // if a backgrounding listener is supplied, set fetch's 'keepalive' flag
  // when the app is backgrounded/terminated so that we can flush the last batch
  // this may be required on platforms such as browser where without 'keepalive'
  // the request may be cancelled (or never start sending) when backgrounded
  // we don't _always_ set the flag because it imposes a 64k payload limit
  let keepalive = false

  if (backgroundingListener) {
    backgroundingListener.onStateChange(state => {
      keepalive = state === 'in-background'
    })
  }

  return function fetchDeliveryFactory (endpoint: string, sendPayloadChecksums?: boolean): Delivery {
    return {
      async send (payload: TracePayload) {
        const body = JSON.stringify(payload.body)

        payload.headers['Bugsnag-Sent-At'] = clock.date().toISOString()

        try {
          const integrityHeaderValue = await getIntegrityHeaderValue(sendPayloadChecksums ?? false, window, body)

          if (integrityHeaderValue) {
            payload.headers['Bugsnag-Integrity'] = integrityHeaderValue
          }

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

function getIntegrityHeaderValue (sendPayloadChecksums: boolean, windowOrWorkerGlobalScope: Window, requestBody: string) {
  if (sendPayloadChecksums && windowOrWorkerGlobalScope.isSecureContext && windowOrWorkerGlobalScope.crypto && windowOrWorkerGlobalScope.crypto.subtle && windowOrWorkerGlobalScope.crypto.subtle.digest && typeof TextEncoder === 'function') {
    const msgUint8 = new TextEncoder().encode(requestBody)
    return windowOrWorkerGlobalScope.crypto.subtle.digest('SHA-1', msgUint8).then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      return 'sha1 ' + hashHex
    })
  }

  return Promise.resolve()
}
