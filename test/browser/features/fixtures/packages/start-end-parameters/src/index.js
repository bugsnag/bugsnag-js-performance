import BugsnagPerformance from '@bugsnag/js-performance-browser'

const apiKey = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])
const endpoint = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 1 })

const timeOrigin = performance.timeOrigin || performance.timing.navigationStart

let span

document.getElementById("null").addEventListener("click", () => {
  if (!span) {
    span = BugsnagPerformance.startSpan('Custom/null')
  } else {
    span.end()
    span = null
  }
})

document.getElementById("number").addEventListener("click", () => {
  if (!span) {
    const startTime = new Date().getTime() - timeOrigin
    span = BugsnagPerformance.startSpan('Custom/number', startTime)
  } else {
    const endTime = new Date().getTime() - timeOrigin
    span.end(endTime)
    span = null
  }
})

document.getElementById("date").addEventListener("click", () => {
  if (!span) {
    const startTime = new Date()
    span = BugsnagPerformance.startSpan('Custom/date', startTime)
  } else {
    const endTime = new Date()
    span.end(endTime)
    span = null
  }
})
