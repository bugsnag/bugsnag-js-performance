import BugsnagPerformance from '@bugsnag/browser-performance'
import { NamedSpanQuery, BugsnagNamedSpansPlugin } from '@bugsnag/plugin-named-spans'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({
  apiKey,
  endpoint,
  maximumBatchSize: 1,
  autoInstrumentFullPageLoads: false,
  autoInstrumentNetworkRequests: false,
  autoInstrumentRouteChanges: false,
  serviceName: 'named-spans',
  plugins: [new BugsnagNamedSpansPlugin()],
})

BugsnagPerformance.startSpan('Span 1')

const span = BugsnagPerformance.getSpanControls(new NamedSpanQuery('Span 1'))
span.setAttribute('custom_attribute', true)
span.end()