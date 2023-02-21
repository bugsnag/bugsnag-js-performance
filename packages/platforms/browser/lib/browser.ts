import { createClient } from '@bugsnag/js-performance-core'
import clock from './clock'
import browserDelivery from './delivery'
import idGenerator from './id-generator'
import createProcessor from './processor'
import createResourceAttributesSource from './resource-attributes-source'
import spanAttributesSource from './span-attributes-source'

const BugsnagPerformance = createClient({
  clock,
  resourceAttributesSource: createResourceAttributesSource(navigator),
  spanAttributesSource,
  idGenerator,
  processor: createProcessor(browserDelivery(global.fetch))
})

export default BugsnagPerformance
