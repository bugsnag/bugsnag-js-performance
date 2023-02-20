import type { ResourceAttributes } from '@bugsnag/js-performance-core/lib/attributes'
import type { Processor } from '@bugsnag/js-performance-core/lib/processor'
import delivery from './delivery'

// Can we store these somewhere better?
let endpoint: string
let apiKey: string
let resourceAttributesSource: () => ResourceAttributes

const processor: Processor = {
  add: (span) => {
    delivery.send(endpoint, apiKey, [span], resourceAttributesSource())
  },
  configure: (config, attributesSource) => {
    apiKey = config.apiKey
    endpoint = config.endpoint
    resourceAttributesSource = attributesSource
  }
}

export default processor
