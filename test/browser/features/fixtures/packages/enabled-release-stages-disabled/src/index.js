import BugsnagPerformance from '@bugsnag/js-performance-browser'

const apiKey = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])
const endpoint = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])

BugsnagPerformance.start({ apiKey, endpoint, releaseStage: 'test', enabledReleaseStages: ['production'], maximumBatchSize: 1 })

BugsnagPerformance.startSpan('Custom/Should not send').end()
