import BugsnagPerformance from '@bugsnag/react-native-performance'
import { NativeScenarioLauncher } from '../../lib/native'
import { NativeSpanQuery } from "@bugsnag/plugin-react-native-span-access";

export const name = 'NativeNamedSpanBenchmark'
export const isAsync = true
export const run = (benchmarkTracker) => {
  let spanCount = 1
  return benchmarkTracker.measureRepeated(async () => {
    const spanName = `NativeTestSpan[${spanCount}]`
    spanCount++

    // this benchmark doesn't consider the overhead of creating the native span, only retrieving updating & ending it
    await benchmarkTracker.runWithTimingDisabled(() => NativeScenarioLauncher.startNativeSpan({
      name: spanName,
    }))

    const nativeSpanControls = BugsnagPerformance.getSpanControls(new NativeSpanQuery(spanName))
    await nativeSpanControls.updateSpan((mutator) => {
      mutator.setAttribute('test.remote.attribute', spanName)
      mutator.end(performance.now())
    })
  })
}
