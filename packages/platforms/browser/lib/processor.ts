import { attributeToJson, type ResourceAttributeSource } from '@bugsnag/js-performance-core/lib/attributes'
import type { Delivery, DeliveryPayload } from '@bugsnag/js-performance-core/lib/delivery'
import type { Processor } from '@bugsnag/js-performance-core/lib/processor'
import { spanToJson } from '@bugsnag/js-performance-core/lib/span'

let endpoint: string | undefined
let apiKey: string | undefined
let resourceAttributesSource: ResourceAttributeSource | undefined

function createProcessor (delivery: Delivery): Processor {
  return {
    add: (span) => {
      if (!endpoint || !apiKey || !resourceAttributesSource) {
        return // TODO: logger.error
      }

      const resourceAttributes = resourceAttributesSource()
      const spans = [span]

      const payload: DeliveryPayload = {
        resourceSpans: [
          {
            resource: {
              // @ts-expect-error undefined values need to be removed in map
              attributes: Object.entries(resourceAttributes).map(([key, value]) => attributeToJson(key, value))
            },
            scopeSpans: [
              {
                // @ts-expect-error undefined values need to be removed in map
                spans: spans.map(spanToJson)
              }
            ]
          }
        ]
      }

      delivery.send(endpoint, apiKey, payload)
    },
    configure: (config, attributesSource) => {
      apiKey = config.apiKey
      endpoint = config.endpoint
      resourceAttributesSource = attributesSource
    }
  }
}

export default createProcessor
