import { attributeToJson } from '@bugsnag/js-performance-core/lib/attributes'
import type { Delivery } from '@bugsnag/js-performance-core/lib/delivery'
import type { SpanInternal } from '@bugsnag/js-performance-core/lib/span'

type Fetch = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>

function browserDelivery (fetch: Fetch): Delivery {
  return {
    send: (endpoint, apiKey, spans, resourceAtrributes) => {
      function shapeSpan (span: SpanInternal) {
        return {
          name: span.name,
          kind: span.kind,
          spanId: span.id,
          traceId: span.traceId,
          startTimeUnixNano: span.startTime, // TODO: Convert to absolute timestamp
          endTimeUnixNano: span.endTime, // TODO: Convert to absolute timestamp
          attributes: Object.entries(span.attributes).map(([key, value]) => attributeToJson(key, value))
        }
      }

      const payload = {
        resourceSpans: [
          {
            resource: {
              attributes: Object.entries(resourceAtrributes).map(([key, value]) => attributeToJson(key, value))
            },
            scopeSpans: [
              {
                spans: spans.map(shapeSpan)
              }
            ]
          }
        ]
      }

      const body = JSON.stringify(payload)

      return new Promise((resolve, reject) => {
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Bugsnag-Api-Key': apiKey,
            'Content-Type': 'application/json'
          },
          body
        })
          .then(res => { resolve() })
          .catch(err => { reject(err) })
      })
    }
  }
}

export default browserDelivery
