import BugsnagPerformance from '@bugsnag/js-performance-browser'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({ apiKey, endpoint, enabledReleaseStages: ['test'], releaseStage: 'test', maximumBatchSize: 1 })

BugsnagPerformance.startSpan('Custom/Should send').end()
