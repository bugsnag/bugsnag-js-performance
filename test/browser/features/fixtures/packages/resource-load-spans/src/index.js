import BugsnagPerformance from "@bugsnag/browser-performance"

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get("api_key")
const endpoint = parameters.get("endpoint")

const span = BugsnagPerformance.startSpan("[Custom]/resource-load-spans")

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 4, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: false })

document.getElementById("end-span").addEventListener("click", () => {
    span.end()
})
