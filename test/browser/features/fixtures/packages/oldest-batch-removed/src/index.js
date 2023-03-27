import BugsnagPerformance from '@bugsnag/js-performance-browser'

const apiKey = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])
const endpoint = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])

BugsnagPerformance.start({ apiKey, endpoint })

// 1 span - to be discarded
BugsnagPerformance.startSpan("Custom/Span to discard").end()

// Fill 11 batches, all to fail delivery and be added to queue
for (let i = 0; i < 1099; i++) {
    BugsnagPerformance.startSpan(`Custom/Span to retry ${i}`).end()
}

// 12th batch, to be succesfully delivered and trigger re-delivery of the 10 queued payloads
for (let i = 0; i < 100; i++) {
    BugsnagPerformance.startSpan(`Custom/Span to deliver ${i}`).end()
}
