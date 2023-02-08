import { createClient } from '@bugsnag/js-performance-core'

const BugsnagPerformance = createClient({ processor: { add: () => {} } })

export default BugsnagPerformance
