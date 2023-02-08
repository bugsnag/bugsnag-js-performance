import { createClient } from '@bugsnag/js-performance-core'
import idGenerator from './id-generator'

const BugsnagPerformance = createClient({
  processor: { add: () => {} },
  idGenerator
})

export default BugsnagPerformance
