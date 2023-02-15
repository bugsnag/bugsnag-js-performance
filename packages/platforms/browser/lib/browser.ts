import { createClient } from '@bugsnag/js-performance-core'
import clock from './clock'
import idGenerator from './id-generator'
import { resourceAttributesSource } from './resource-attributes-source'
import { spanAttributesSource } from './span-attributes-source'

const BugsnagPerformance = createClient({
  clock,
  resourceAttributesSource,
  spanAttributesSource,
  idGenerator,
  processor: { add: () => {} }
})

export default BugsnagPerformance
