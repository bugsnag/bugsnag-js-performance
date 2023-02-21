import type { Delivery } from '@bugsnag/js-performance-core/lib/delivery'

type Fetch = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>

function browserDelivery (fetch: Fetch): Delivery {
  return {
    send: (endpoint, apiKey, payload) => {
      return new Promise((resolve, reject) => {
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Bugsnag-Api-Key': apiKey,
            'Content-Type': 'application/json'
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
