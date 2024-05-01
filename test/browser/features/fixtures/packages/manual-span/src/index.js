import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')
const reflectEndpoint = '/reflect?status=200&delay_ms=0'

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 1, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: false, autoInstrumentRouteChanges: false })

document.getElementById('send-span').onclick = () => {
  const spanOptions = {}
  
  if (parameters.has('isFirstClass')) {
    spanOptions.isFirstClass = JSON.parse(parameters.get('isFirstClass'))
  }

  const span = BugsnagPerformance.startSpan("Custom/ManualSpanScenario", spanOptions)
  span.end()
}

document.getElementById('send-network-span').addEventListener('click', () => {
  const span = BugsnagPerformance.startNetworkSpan({ method: "GET", url: reflectEndpoint })
  fetch(reflectEndpoint).then(({ status }) => {
    span.end({ status })
  })
})
