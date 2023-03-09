import { ResourceAttributes } from '../../lib/attributes'

function resourceAttributesSource (): ResourceAttributes {
  return new ResourceAttributes('test', 'bugsnag.performance.core', '1.2.3')
}

export default resourceAttributesSource
