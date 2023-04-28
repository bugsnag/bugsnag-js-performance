import { ResourceAttributes, type Configuration, type ResourceAttributeSource } from '@bugsnag/js-performance-core'

const resourceAttributesSource: ResourceAttributeSource<Configuration> = () => {
  return new ResourceAttributes('test', '3.4.5', 'bugsnag.performance.core', '1.2.3')
}

export default resourceAttributesSource
