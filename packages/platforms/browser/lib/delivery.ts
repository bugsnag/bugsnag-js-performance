import type { Delivery, Fetch } from '@bugsnag/js-performance-core/lib/delivery'

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
