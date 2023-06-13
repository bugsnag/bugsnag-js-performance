import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')
const reflectEndpoint = '/reflect?status=200&delay_ms=0'

BugsnagPerformance.start({ apiKey, endpoint, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: true, maximumBatchSize: 1 })

document.getElementById("xhr-success").addEventListener("click", () => {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', reflectEndpoint)
  xhr.send()
})

document.getElementById("fetch-success").addEventListener("click", () => {
  fetch(reflectEndpoint)
})

document.getElementById("failed-requests").addEventListener("click", () => {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', "http://localhost:65536")
  xhr.send()
  fetch(invalidUrl)
})
