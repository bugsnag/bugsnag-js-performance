import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({ apiKey, endpoint, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: false })

let spanNumber = 0

document.getElementById("add-span-to-batch").addEventListener("click", () => {
  BugsnagPerformance.startSpan(`Span ${++spanNumber}`).end()
})
