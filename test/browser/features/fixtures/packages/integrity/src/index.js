import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({
  apiKey,
  endpoint,
  sendPayloadChecksums: true,
  maximumBatchSize: 1,
  autoInstrumentFullPageLoads: false,
  autoInstrumentNetworkRequests: false,
  autoInstrumentRouteChanges: false,
  serviceName: 'integrity'
})

document.getElementById('send-span').onclick = () => {
  const spanOptions = {}
  
  if (parameters.has('isFirstClass')) {
    spanOptions.isFirstClass = JSON.parse(parameters.get('isFirstClass'))
  }

  const span = BugsnagPerformance.startSpan("Custom/ManualSpanScenario", spanOptions)
  span.end()
}

