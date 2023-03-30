import BugsnagPerformance from '@bugsnag/js-performance-browser'

const apiKey = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])
const endpoint = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])

BugsnagPerformance.start({ apiKey, endpoint })

let spanNumber = 0

document.getElementById("add-span-to-batch").addEventListener("click", () => {
  BugsnagPerformance.startSpan(`Span ${++spanNumber}`).end()
})
