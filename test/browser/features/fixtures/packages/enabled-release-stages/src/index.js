import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({ apiKey, endpoint, enabledReleaseStages: ['test'], releaseStage: 'test', maximumBatchSize: 1, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: false })

BugsnagPerformance.startSpan('Custom/Should send').end()
