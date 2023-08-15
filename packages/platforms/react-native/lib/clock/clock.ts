import { millisecondsToNanoseconds, type Clock } from '@bugsnag/core-performance'

interface Performance {
  now: () => number
}

const createClock = (performance: Performance): Clock => {
  // Prevent clock from running backwards
  // React Native 0.68 introduced a bug where `performance.now` was no longer monotonic https://github.com/facebook/react-native/issues/33977
  // NOTE: If our new "now" is less than the previous "now" - we will use the previous value.
  let previousClock = performance.now()
  const currentPerfTime = () => {
    const newClock = performance.now()
    if (newClock > previousClock) {
      previousClock = newClock
      return newClock
    }
    return previousClock
  }

  // Measurable "monotonic" time
  // In React Native, `performance.now` often returns some very high values, but does not expose the `timeOrigin` it uses to calculate what "now" is.
  // by storing the value of `performance.now` when the app starts, we can remove that value from any further `.now` calculations, and add it to the current "wall time" to get a useful timestamp.
  const startPerfTime = currentPerfTime()
  const startWallTime = Date.now()

  return {
    now: currentPerfTime,
    date: () => new Date(currentPerfTime() - startPerfTime + startWallTime),
    convert: (date: Date) => date.getTime() - startWallTime + startPerfTime,
    // convert milliseconds since timeOrigin to full timestamp
    toUnixTimestampNanoseconds: (time: number) =>
      millisecondsToNanoseconds(
        time - startPerfTime + startWallTime
      ).toString()
  }
}

export default createClock
