import BugsnagPerformance from '@bugsnag/js-performance-browser'

const apiKey = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])
const endpoint = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])

BugsnagPerformance.start({ apiKey, endpoint, retryQueueMaxSize: 3, maximumBatchSize: 1 })

const spans = [
    "Custom/Span to discard", 
    "Custom/Span to retry 1",
    "Custom/Span to retry 2",
    "Custom/Span to retry 3",
    "Custom/Span to deliver"
]

spans.forEach(name => {
    const span = BugsnagPerformance.startSpan(name)
    setTimeout(() => {
        span.end()
    }, 100)
})
