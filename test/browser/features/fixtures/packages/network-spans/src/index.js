import BugsnagPerformance from '@bugsnag/js-performance-browser'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')
const reflectEndpoint = parameters.get('reflect') + "?status=200&delay_ms=0"
const invalidUrl = "http://localhost:65536"

BugsnagPerformance.start({ apiKey, endpoint, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: true, maximumBatchSize: 1 })

document.getElementById("xhr-success").addEventListener("click", () => {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', reflectEndpoint)
  xhr.send()
})

document.getElementById("fetch-success").addEventListener("click", () => {
  fetch(reflectEndpoint)
})

document.getElementById("xhr-failure").addEventListener("click", () => {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', invalidUrl)
  xhr.send()
})

document.getElementById("fetch-failure").addEventListener("click", () => {
  fetch(invalidUrl)
})
