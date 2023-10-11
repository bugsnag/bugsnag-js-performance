import { millisecondsToNanoseconds, type Clock } from '@bugsnag/core-performance'

interface Performance {
  now: () => number
}

const createClock = (performance: Performance): Clock => {
  // Measurable "monotonic" time
  // In React Native, `performance.now` often returns some very high values, but does not expose the `timeOrigin` it uses to calculate what "now" is.
  // by storing the value of `performance.now` when the app starts, we can remove that value from any further `.now` calculations, and add it to the current "wall time" to get a useful timestamp.
  const startPerfTime = performance.now()
  const startWallTime = Date.now()

  return {
    now: performance.now,
    date: () => new Date(performance.now() - startPerfTime + startWallTime),
    convert: (date: Date) => date.getTime() - startWallTime + startPerfTime,
    // convert milliseconds since timeOrigin to full timestamp
    toUnixTimestampNanoseconds: (time: number) =>
      millisecondsToNanoseconds(
        time - startPerfTime + startWallTime
      ).toString()
  }
}

export default createClock
