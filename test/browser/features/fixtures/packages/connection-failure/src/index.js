import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 1, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: false })

let spanNumber = 0

document.getElementById("send-span1").addEventListener("click", () => {
  BugsnagPerformance.startSpan(`Custom/Span ${++spanNumber}`).end()
})

document.getElementById("send-span2").addEventListener("click", () => {
  BugsnagPerformance.startSpan(`Custom/Span ${++spanNumber}`).end()
})
