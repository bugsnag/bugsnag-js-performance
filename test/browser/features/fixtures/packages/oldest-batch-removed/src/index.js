import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({ apiKey, endpoint, retryQueueMaxSize: 1, maximumBatchSize: 1, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: false, appVersion: '1.2.3' })

document.getElementById("send-first-span").addEventListener("click", () => {
  BugsnagPerformance.startSpan("Custom/Span to discard").end()
})

document.getElementById("send-retry-spans").addEventListener("click", async () => {
  BugsnagPerformance.startSpan("Custom/Span to retry").end()
})

document.getElementById("send-final-span").addEventListener("click", () => {
  BugsnagPerformance.startSpan("Custom/Span to deliver").end()
})

