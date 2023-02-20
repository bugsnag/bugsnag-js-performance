import { createClient } from '@bugsnag/js-performance-core'
import clock from './clock'
import idGenerator from './id-generator'
import processor from './processor'
import createResourceAttributesSource from './resource-attributes-source'
import spanAttributesSource from './span-attributes-source'

const BugsnagPerformance = createClient({
  clock,
  resourceAttributesSource: createResourceAttributesSource(navigator),
  spanAttributesSource,
  idGenerator,
  processor
})

export default BugsnagPerformance
