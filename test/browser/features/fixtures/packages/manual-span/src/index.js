import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 9, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: false })

const spanOptions = {}

if (parameters.has('isFirstClass')) {
  spanOptions.isFirstClass = JSON.parse(parameters.get('isFirstClass'))
}

function getTime (type) {
  switch (type) {
    case 'date':
      return new Date()
    case 'number':
      return performance.now()
  }
}

const combinations = [
  ['date', 'date'],
  ['date', 'number'],
  ['date', 'undefined'],
  ['number', 'date'],
  ['number', 'number'],
  ['number', 'undefined'],
  ['undefined', 'date'],
  ['undefined', 'number'],
  ['undefined', 'undefined'],
]

for (const combination of combinations) {
  spanOptions.startTime = getTime(combination[0])
  const span = BugsnagPerformance.startSpan("Custom/ManualSpanScenario", spanOptions)
  span.end(getTime(combination[1]))
}
