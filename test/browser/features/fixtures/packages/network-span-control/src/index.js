import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')
const reflectEndpoint = '/reflect?status=200&delay_ms=0'

const commonConfig = {
  apiKey,
  endpoint,
  autoInstrumentFullPageLoads: false,
  autoInstrumentNetworkRequests: true,
  maximumBatchSize: 1,
}

const modifiedUrlConfig = { 
  ...commonConfig,
  networkRequestCallback: (networkRequestInfo) => ({ ...networkRequestInfo, url: 'not-your-ordinary-url' })
}

document.getElementById('fetch-modified-url').addEventListener('click', () => {
  BugsnagPerformance.start(modifiedUrlConfig)
  fetch(reflectEndpoint)
})

document.getElementById('xhr-modified-url').addEventListener('click', () => {
  BugsnagPerformance.start(modifiedUrlConfig)
  const xhr = new XMLHttpRequest()
  xhr.open('GET', reflectEndpoint)
  xhr.send()
})

const deliveryPreventedConfig = { 
  ...commonConfig,
  networkRequestCallback: () => null
}

document.getElementById('fetch-prevented').addEventListener('click', () => {
  BugsnagPerformance.start(deliveryPreventedConfig)
  fetch(reflectEndpoint)
})

document.getElementById('xhr-prevented').addEventListener('click', () => {
  BugsnagPerformance.start(deliveryPreventedConfig)
  const xhr = new XMLHttpRequest()
  xhr.open('GET', reflectEndpoint)
  xhr.send()
})

document.getElementById('page-load-full-attributes').addEventListener('click', () => {
  BugsnagPerformance.start({
    ...commonConfig,
    autoInstrumentFullPageLoads: true,
    batchInactivityTimeoutMs: 5000,
    maximumBatchSize: 13 
  })
})

document.getElementById('page-load-no-attributes').addEventListener('click', () => {
  BugsnagPerformance.start({
    ...commonConfig,
    sendPageAttributes: { url: false, referrer: false, title: false },
    autoInstrumentFullPageLoads: true,
    batchInactivityTimeoutMs: 5000,
    maximumBatchSize: 13
  })
})

