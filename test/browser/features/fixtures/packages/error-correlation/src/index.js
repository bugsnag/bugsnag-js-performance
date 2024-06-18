import Bugsnag from '@bugsnag/browser'
import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')
const sessions = parameters.get('sessions')
const notify = parameters.get('notify')

Bugsnag.start({ apiKey, endpoints: { notify, sessions } })
BugsnagPerformance.start({ 
  apiKey, 
  endpoint, 
  maximumBatchSize: 1, 
  autoInstrumentFullPageLoads: false, 
  autoInstrumentNetworkRequests: false, 
  autoInstrumentRouteChanges: false 
})

let span
let nestedSpan

document.getElementById('start-span').onclick = () => {
  span = BugsnagPerformance.startSpan("Custom/ErrorCorrelationScenario")
}

document.getElementById('end-span').onclick = () => {
  span.end()
}

document.getElementById('start-nested-span').onclick = () => {
  nestedSpan = BugsnagPerformance.startSpan("Custom/ChildSpan", { makeCurrentContext: false })
}

document.getElementById('end-nested-span').onclick = () => {
  nestedSpan.end()
}

document.getElementById('send-error').onclick = () => {
  Bugsnag.notify(new Error('ErrorCorrelationScenario'))
}
