import BugsnagPerformance from '@bugsnag/js-performance-browser'

const apiKey = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])
const endpoint = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 1 })

BugsnagPerformance.startSpan("Custom/Span 1").end()

// Wait 100ms before delivering second payload
setTimeout(() => {
    BugsnagPerformance.startSpan("Custom/Span 2").end()
}, 100)
