import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')
const reflectEndpoint = '/reflect?status=200&delay_ms=0'

BugsnagPerformance.start({
  apiKey, 
  endpoint,
  autoInstrumentFullPageLoads: false,
  autoInstrumentNetworkRequests: true,
  networkRequestCallback: (requestInfo) => {
    requestInfo.propagateTraceContext = true
    return requestInfo;
  },
  maximumBatchSize: 1,
 })

document.getElementById("xhr").addEventListener("click", () => {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', reflectEndpoint)
  xhr.setRequestHeader('X-Test-Header', 'test')
  xhr.send()
})

document.getElementById("fetch-simple-headers-in-options").addEventListener("click", () => {
  fetch(reflectEndpoint, { headers: { 'X-Test-Header': 'test' }})
})

document.getElementById("fetch-headers-class-in-options").addEventListener("click", () => {
  fetch(reflectEndpoint, { headers: new Headers({ 'X-Test-Header': 'test' })})
})

document.getElementById("fetch-simple-headers-in-request").addEventListener("click", () => {
  const request = new Request(reflectEndpoint, { headers: { 'X-Test-Header': 'test' }})
  fetch(request)
})

document.getElementById("fetch-headers-class-in-request").addEventListener("click", () => {
  const request = new Request(reflectEndpoint, { headers: new Headers({ 'X-Test-Header': 'test' })})
  fetch(request)
})

document.getElementById("fetch-headers-in-request-and-options").addEventListener("click", () => {
  const request = new Request(reflectEndpoint, { headers: new Headers({ 'X-Ignored-Header': 'will be ignored' })})
  fetch(request, { headers: { 'X-Test-Header': 'test' }})
})
