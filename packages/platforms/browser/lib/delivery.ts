import type { Delivery } from '@bugsnag/js-performance-core'

export type Fetch = typeof fetch

function browserDelivery (fetch: Fetch): Delivery {
  return {
    send: (endpoint, apiKey, payload) => {
      const pValue = 1
      const spanCount = payload.resourceSpans.reduce((count, resourceSpan) => count + resourceSpan.scopeSpans.length, 0)

      return new Promise((resolve, reject) => {
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Bugsnag-Api-Key': apiKey,
            'Content-Type': 'application/json',
            'Bugsnag-Span-Sampling': `${pValue}:${spanCount}`
          },
          body: JSON.stringify(payload)
        }).then(() => {
          // TODO: Handle p values, etc.
          resolve()
        }).catch(err => {
          reject(err)
        })
      })
    }
  }
}

export default browserDelivery
