import BugsnagPerformance from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 5, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: false })

// root span
const rootSpan = BugsnagPerformance.startSpan("RootSpan")

// both of these are direct children of the root span
const firstSpan = BugsnagPerformance.startSpan("FirstChildSpan")
const secondChildOfRootSpan = BugsnagPerformance.startSpan("SecondChildSpan", { parentContext: rootSpan })

// parentContext is null so this should start a new root span
const newRootSpan = BugsnagPerformance.startSpan("NewRootSpan", { parentContext: null })

// child of the first child span
const childOfFirstChildSpan = BugsnagPerformance.startSpan("ChildOfFirstChildSpan", { parentContext: firstSpan } )

childOfFirstChildSpan.end()
newRootSpan.end()
secondChildOfRootSpan.end()
firstSpan.end()
rootSpan.end()