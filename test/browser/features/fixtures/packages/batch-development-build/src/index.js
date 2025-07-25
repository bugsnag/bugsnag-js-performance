import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')
const startTime = Date.now()

BugsnagPerformance.start({ 
    apiKey,
    endpoint,
    releaseStage: 'development',
    enabledReleaseStages: ['development'],
    autoInstrumentFullPageLoads: false,
    autoInstrumentNetworkRequests: false
})

const span = BugsnagPerformance.startSpan("Custom/Batch Timeout")
span.setAttribute('test.startTime', startTime)
span.end()
