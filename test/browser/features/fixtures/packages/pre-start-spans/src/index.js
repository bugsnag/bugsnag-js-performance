import BugsnagPerformance from '@bugsnag/js-performance-browser'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.startSpan("Custom/Pre Start Span 0").end()
BugsnagPerformance.startSpan("Custom/Pre Start Span 1").end()
BugsnagPerformance.startSpan("Custom/Pre Start Span 2").end()

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 4, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: false })

BugsnagPerformance.startSpan("Custom/Post Start").end()
