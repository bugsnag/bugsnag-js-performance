import BugsnagPerformance from '@bugsnag/js-performance-browser'

const apiKey = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])
const endpoint = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 1 })

const span = BugsnagPerformance.startSpan("Custom/ManualSpanScenario", new Date('2023-04-04T01:02:03Z'))
span.end(new Date('2023-04-04T02:03:04Z'))
