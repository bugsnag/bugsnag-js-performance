import BugsnagPerformance from '@bugsnag/js-performance-browser'

const apiKey = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])
const endpoint = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 5 })

const spanNames = [
    "Custom/Full Batch 1",
    "Custom/Full Batch 2",
    "Custom/Full Batch 3",
    "Custom/Full Batch 4",
    "Custom/Full Batch 5"
]

for (const name of spanNames) {
    BugsnagPerformance.startSpan(name).end()
}

