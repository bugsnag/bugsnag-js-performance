import { type BackgroundingListener, type Clock, millisecondsToNanoseconds } from '@bugsnag/core-performance'

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

// maximum allowed clock divergence in milliseconds
const MAX_CLOCK_DRIFT_MS = 300000

function createClock (performance: PerformanceWithOptionalTimeOrigin, backgroundingListener: BackgroundingListener): Clock {
  let calculatedTimeOrigin = performance.timeOrigin === undefined
    ? performance.timing.navigationStart
    : performance.timeOrigin

  // if the machine has been sleeping the monatomic clock used by performance.now() may have been paused,
  // so when the app returns to the foreground we need to check if this has drifted significantly from Date.now()
  // if the drift is > 5 minutes re-set the clock's origin to bring it back in line with Date.now()
  backgroundingListener.onStateChange(state => {
    if (state === 'in-foreground') {
      if (Math.abs(Date.now() - (calculatedTimeOrigin + performance.now())) > MAX_CLOCK_DRIFT_MS) {
        calculatedTimeOrigin = Date.now() - performance.now()
      }
    }
  })

  return {
    now: () => performance.now(),
    date: () => new Date(calculatedTimeOrigin + performance.now()),
    convert: (date) => date.getTime() - calculatedTimeOrigin,
    // convert milliseconds since timeOrigin to full timestamp
    toUnixTimestampNanoseconds: (time: number) => millisecondsToNanoseconds(calculatedTimeOrigin + time).toString()
  }
}

export default createClock
