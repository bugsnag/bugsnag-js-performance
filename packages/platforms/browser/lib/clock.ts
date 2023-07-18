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

function recalculateTimeOrigin (timeOrigin: number, performance: PerformanceWithOptionalTimeOrigin): number {
  // if the machine has been sleeping the monatomic clock used by performance.now() may have been paused,
  // so we need to check if this has drifted significantly from Date.now()
  // if the drift is > 5 minutes re-set the clock's origin to bring it back in line with Date.now()
  if (Math.abs(Date.now() - (timeOrigin + performance.now())) > MAX_CLOCK_DRIFT_MS) {
    return Date.now() - performance.now()
  }

  return timeOrigin
}

function createClock (performance: PerformanceWithOptionalTimeOrigin, backgroundingListener: BackgroundingListener): Clock {
  const initialTimeOrigin = performance.timeOrigin === undefined
    ? performance.timing.navigationStart
    : performance.timeOrigin

  // the performance clock could be shared between different tabs running in the same process
  // so may already have diverged - for this reason we calculate a time origin when we first create the clock
  // as well as when the app returns to the foreground
  let calculatedTimeOrigin = recalculateTimeOrigin(initialTimeOrigin, performance)
  backgroundingListener.onStateChange(state => {
    if (state === 'in-foreground') {
      calculatedTimeOrigin = recalculateTimeOrigin(calculatedTimeOrigin, performance)
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
