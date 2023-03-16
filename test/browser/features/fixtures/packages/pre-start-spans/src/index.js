import BugsnagPerformance from '@bugsnag/js-performance-browser'

const apiKey = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])
const endpoint = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])

BugsnagPerformance.startSpan("Custom/Pre Start Span 0").end()
BugsnagPerformance.startSpan("Custom/Pre Start Span 1").end()
BugsnagPerformance.startSpan("Custom/Pre Start Span 2").end()

BugsnagPerformance.start({ apiKey, endpoint, batchInactivityTimeoutMilliseconds: 1000, maximumBatchSize: 1 })

BugsnagPerformance.startSpan("Custom/Post Start").end()
