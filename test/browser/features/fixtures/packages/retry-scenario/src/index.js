import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 1, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: false })

document.getElementById("send-span").addEventListener("click", () => {
  BugsnagPerformance.startSpan("Custom/Deliver").end()
})

BugsnagPerformance.startSpan("Custom/Reject").end()
