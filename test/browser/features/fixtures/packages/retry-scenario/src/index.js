import BugsnagPerformance from '@bugsnag/js-performance-browser'

const apiKey = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])
const endpoint = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 1 })

BugsnagPerformance.startSpan("Custom/Span 1").end()

// Avoid a possible race condition by waiting before sending the second payload
// Otherwise it could reach Maze Runner before the first payload, which
// would apply the response status codes out of order
setTimeout(() => {
    BugsnagPerformance.startSpan("Custom/Span 2").end()
}, 100)
