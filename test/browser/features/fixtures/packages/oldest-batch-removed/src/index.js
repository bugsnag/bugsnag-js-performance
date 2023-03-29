import BugsnagPerformance from '@bugsnag/js-performance-browser'

const apiKey = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])
const endpoint = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])

BugsnagPerformance.start({ apiKey, endpoint, retryQueueMaxSize: 3, maximumBatchSize: 1 })

document.getElementById("send-spans").addEventListener("click", () => {
    BugsnagPerformance.startSpan("Custom/Span to retry 1").end()
    BugsnagPerformance.startSpan("Custom/Span to retry 2").end()
    BugsnagPerformance.startSpan("Custom/Span to retry 3").end()
})

document.getElementById("send-final-span").addEventListener("click", () => {
    BugsnagPerformance.startSpan("Custom/Span to deliver").end()
})

BugsnagPerformance.startSpan("Custom/Span to discard").end()
