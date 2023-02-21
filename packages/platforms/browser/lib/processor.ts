import type { ResourceAttributes } from '@bugsnag/js-performance-core/lib/attributes'
import type { Processor } from '@bugsnag/js-performance-core/lib/processor'
import createDelivery from './delivery'

let endpoint: string | undefined
let apiKey: string | undefined
let resourceAttributesSource: (() => ResourceAttributes) | undefined

const processor: Processor = {
  add: (span) => {
    if (!endpoint || !apiKey || !resourceAttributesSource) {
      return // TODO: logger.error
    }

    const delivery = createDelivery(global.fetch)
    delivery.send(endpoint, apiKey, [span], resourceAttributesSource())
  },
  configure: (config, attributesSource) => {
    apiKey = config.apiKey
    endpoint = config.endpoint
    resourceAttributesSource = attributesSource
  }
}

export default processor
