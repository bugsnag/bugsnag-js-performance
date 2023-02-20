import type { Delivery } from '@bugsnag/js-performance-core/lib/delivery'
import { type SpanInternal } from '@bugsnag/js-performance-core/lib/span'
import toJSONAttribute from './to-json-attribute'

const browserDelivery: Delivery = {
  send: (endpoint, apiKey, spans, resourceAtrributes) => {
    function shapeSpan (span: SpanInternal) {
      return {
        id: span.id,
        name: span.name,
        kind: span.kind,
        spanId: span.id, // Should this be here?
        // traceId: '...', // Not yet implemented
        startTimeUnixNano: span.startTime,
        endTimeUnixNano: span.endTime,
        attributes: Object.entries(span.attributes).map(([key, value]) => toJSONAttribute(key, value))
      }
    }

    const payload = {
      resourceSpans: [
        {
          resource: {
            attributes: Object.entries(resourceAtrributes).map(([key, value]) => toJSONAttribute(key, value))
          },
          scopeSpans: [
            {
              spans: spans.map(shapeSpan)
            }
          ]
        }
      ]
    }

    return new Promise((resolve, reject) => {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Bugsnag-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
        .then(res => { resolve() })
        .catch(err => { reject(err) })
    })
  }
}

export default browserDelivery
