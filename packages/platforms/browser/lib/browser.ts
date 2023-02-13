import { createClient } from '@bugsnag/js-performance-core'
import idGenerator from './id-generator'
import clock from './clock'
import resourceAttributes from './resource-attributes'

const BugsnagPerformance = createClient({
  clock,
  resourceAttributes,
  idGenerator,
  processor: { add: () => {} }
})

export default BugsnagPerformance
