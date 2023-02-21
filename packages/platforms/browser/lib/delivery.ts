import { attributeToJson } from '@bugsnag/js-performance-core/lib/attributes'
import type { Delivery } from '@bugsnag/js-performance-core/lib/delivery'
import { spanToJson } from '@bugsnag/js-performance-core/lib/span'

type Fetch = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>

function browserDelivery (fetch: Fetch): Delivery {
  return {
    send: (endpoint, apiKey, spans, resourceAtrributes) => {
      const payload = {
        resourceSpans: [
          {
            resource: {
              attributes: Object.entries(resourceAtrributes).map(([key, value]) => attributeToJson(key, value))
            },
            scopeSpans: [
              {
                spans: spans.map(spanToJson)
              }
            ]
          }
        ]
      }

      const body = JSON.stringify(payload)

      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'Bugsnag-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body
      })
    }
  }
}

export default browserDelivery
