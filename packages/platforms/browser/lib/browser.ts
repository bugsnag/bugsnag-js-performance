import { createClient } from '@bugsnag/js-performance-core'
import idGenerator from './id-generator'
import clock from './clock'

const BugsnagPerformance = createClient({
  clock,
  idGenerator,
  processor: { add: () => {} }
})

export default BugsnagPerformance
