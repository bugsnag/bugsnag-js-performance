import {
  type BackgroundingListener,
  type Delivery,
  type DeliveryFactory,
  responseStateFromStatusCode
} from '@bugsnag/js-performance-core'

export type Fetch = typeof fetch

function createBrowserDeliveryFactory (fetch: Fetch, backgroundingListener: BackgroundingListener): DeliveryFactory {
  // we set fetch's 'keepalive' flag if the app is backgrounded/terminated so
  // that we can flush the last batch - without 'keepalive' the browser can
  // cancel (or never start sending) this request
  // we don't _always_ set the flag because it imposes a 64k payload limit
  let keepalive = false

  backgroundingListener.onStateChange(state => {
    keepalive = state === 'in-background'
  })

  return function browserDeliveryFactory (apiKey: string, endpoint: string): Delivery {
    return {
      async send (payload) {
        const spanCount = payload.resourceSpans.reduce((count, resourceSpan) => count + resourceSpan.scopeSpans.length, 0)

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            keepalive,
            body: JSON.stringify(payload),
            headers: {
              'Bugsnag-Api-Key': apiKey,
              'Content-Type': 'application/json',
              'Bugsnag-Span-Sampling': `1.0:${spanCount}`
            }
          })

          return { state: responseStateFromStatusCode(response.status) }
        } catch (err) {
          return { state: 'failure-retryable' }
        }
      }
    }
  }
}

export default createBrowserDeliveryFactory
