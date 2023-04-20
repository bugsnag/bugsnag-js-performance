import BugsnagPerformance from '@bugsnag/js-performance-browser'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

BugsnagPerformance.start({ apiKey, endpoint, retryQueueMaxSize: 3, maximumBatchSize: 1 })

document.getElementById("send-spans").addEventListener("click", () => {
  BugsnagPerformance.startSpan("Custom/Span to retry 1").end()
  BugsnagPerformance.startSpan("Custom/Span to retry 2").end()
  BugsnagPerformance.startSpan("Custom/Span to retry 3").end()
})

document.getElementById("send-final-span").addEventListener("click", () => {
  BugsnagPerformance.startSpan("Custom/Span to deliver").end()
})

BugsnagPerformance.startSpan("Custom/Span to discard").end()
