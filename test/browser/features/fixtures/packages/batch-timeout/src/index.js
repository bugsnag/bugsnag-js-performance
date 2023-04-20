import BugsnagPerformance from '@bugsnag/js-performance-browser'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({ apiKey, endpoint, batchInactivityTimeoutMs: 2000 })

const span = BugsnagPerformance.startSpan("Custom/Batch Timeout")
span.end()
