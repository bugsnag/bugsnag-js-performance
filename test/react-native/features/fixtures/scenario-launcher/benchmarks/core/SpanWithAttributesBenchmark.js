import BugsnagPerformance from '@bugsnag/react-native-performance'

export const name = 'SpanWithAttributesBenchmark'
export const isAsync = false
export const run = (benchmarkTracker) => {
  benchmarkTracker.measureRepeated(() => {
    const span = BugsnagPerformance.startSpan()
    span.setAttribute('custom.string', 'abc123')
    span.setAttribute('custom.int', 123)
    span.setAttribute('custom.number', 123.321)
    span.setAttribute('custom.bool', false)
    span.end()
  })
}
