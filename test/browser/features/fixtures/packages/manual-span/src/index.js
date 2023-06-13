import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 1, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: false })

const span = BugsnagPerformance.startSpan("Custom/ManualSpanScenario")
span.end()
