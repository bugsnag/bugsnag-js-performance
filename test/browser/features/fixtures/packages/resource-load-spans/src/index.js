import BugsnagPerformance from "@bugsnag/browser-performance"

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get("api_key")
const endpoint = parameters.get("endpoint")

const span = BugsnagPerformance.startSpan("[Custom]/resource-load-spans")

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 4, batchInactivityTimeoutMs: 5000, autoInstrumentFullPageLoads: false, autoInstrumentNetworkRequests: false })

document.getElementById("end-span").addEventListener("click", () => {
    const node = document.getElementById("image-container")
    const img = new Image()
    node.appendChild(img)
    img.src = "/favicon.png?height=100&width=100"
    img.onload = () => {
        span.end()
    }
})
