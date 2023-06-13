import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 5, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: false })

const spanNames = [
  "Custom/Full Batch 1",
  "Custom/Full Batch 2",
  "Custom/Full Batch 3",
  "Custom/Full Batch 4",
  "Custom/Full Batch 5"
]

for (const name of spanNames) {
  BugsnagPerformance.startSpan(name).end()
}
