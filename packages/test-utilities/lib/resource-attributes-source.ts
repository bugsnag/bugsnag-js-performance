import { ResourceAttributes } from '@bugsnag/js-performance-core'

function resourceAttributesSource (): ResourceAttributes {
  return new ResourceAttributes('test', '3.4.5', 'bugsnag.performance.core', '1.2.3')
}

export default resourceAttributesSource
