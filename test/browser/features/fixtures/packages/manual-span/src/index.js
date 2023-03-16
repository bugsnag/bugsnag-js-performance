import BugsnagPerformance from '@bugsnag/js-performance-browser'

const apiKey = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])
const endpoint = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])

BugsnagPerformance.start({ apiKey, endpoint, batchInactivityTimeoutMilliseconds: 1000, maximumBatchSize: 1 })

const span = BugsnagPerformance.startSpan("Custom/ManualSpanScenario")
span.end()
