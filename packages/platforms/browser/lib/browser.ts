import { createClient } from '@bugsnag/js-performance-core'
import clock from './clock.js'
import idGenerator from './id-generator.js'
import createResourceAttributesSource from './resource-attributes-source.js'
import spanAttributesSource from './span-attributes-source.js'

const BugsnagPerformance = createClient({
  clock,
  resourceAttributesSource: createResourceAttributesSource(navigator),
  spanAttributesSource,
  idGenerator,
  processor: { add: () => {} }
})

export default BugsnagPerformance
