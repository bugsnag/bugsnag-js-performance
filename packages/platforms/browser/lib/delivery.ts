import { type Delivery, responseStateFromStatusCode } from '@bugsnag/js-performance-core'

export type Fetch = typeof fetch

function browserDelivery (fetch: Fetch): Delivery {
  return {
    async send (endpoint, apiKey, payload) {
      const spanCount = payload.resourceSpans.reduce((count, resourceSpan) => count + resourceSpan.scopeSpans.length, 0)

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Bugsnag-Api-Key': apiKey,
            'Content-Type': 'application/json',
            'Bugsnag-Span-Sampling': `1.0:${spanCount}`
          },
          body: JSON.stringify(payload)
        })

        return { state: responseStateFromStatusCode(response.status) }
      } catch (err) {
        return { state: 'failure-retryable' }
      }
    }
  }
}

export default browserDelivery
