import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({ 
  apiKey, 
  endpoint,
  maximumBatchSize: 1,
  attributeCountLimit: 11,
  autoInstrumentFullPageLoads: false,
  autoInstrumentNetworkRequests: false,
  autoInstrumentRouteChanges: false,
  networkRequestCallback: () => null
})

setTimeout(() => {
  const span = BugsnagPerformance.startSpan('Custom/CustomAttributesScenario')

  // 10 custom attributes
  span.setAttribute('custom.string', 'custom attribute')
  span.setAttribute('custom.int', 12345)
  span.setAttribute('custom.double', 123.45)
  span.setAttribute('custom.bool.true', true)
  span.setAttribute('custom.bool.false', false)
  span.setAttribute('custom.array.empty', [])
  span.setAttribute('custom.array.string', ['one', 'two', 'three'])
  span.setAttribute('custom.array.int', [1, 2, 3])
  span.setAttribute('custom.array.double', [1.1, 2.2, 3.3])
  span.setAttribute('custom.array.bool', [true, false, true])

  // This attribute should be dropped because it exceeds the limit of 11
  // 10 custom attributes plus the bugsnag.span.category attribute
  span.setAttribute('custom.array.dropped', 'too many attributes')
  
  span.end()
})
