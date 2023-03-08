import { type Clock, millisecondsToNanoseconds } from '@bugsnag/js-performance-core'

// a cut-down PerformanceTiming interface, since we don't care about most of
// its properties
interface PerformanceTiming {
  navigationStart: number
}

// the 'Performance' type says 'timeOrigin' is always available, but that's not
// true on Safari <15 so we mark it as possibly 'undefined'
interface PerformanceWithOptionalTimeOrigin {
  now: () => number
  timeOrigin?: number
  timing: PerformanceTiming
}

function createClock (performance: PerformanceWithOptionalTimeOrigin): Clock {
  const timeOrigin = performance.timeOrigin || performance.timing.navigationStart

  return {
    now: () => performance.now(),
    convert: (date) => millisecondsToNanoseconds(date.getTime() - timeOrigin),
    // convert nanoseconds since timeOrigin to full timestamp
    toUnixTimestampNanoseconds: (time: number) => millisecondsToNanoseconds(timeOrigin + time)
  }
}

export default createClock
