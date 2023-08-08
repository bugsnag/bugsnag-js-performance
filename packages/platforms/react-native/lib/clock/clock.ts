import { millisecondsToNanoseconds, type Clock } from '@bugsnag/core-performance'

interface Performance {
  now: () => number
}

const createClock = (performance: Performance): Clock => {
  // Prevent clock from running backwards
  let previousClock = performance.now()
  const now = () => {
    const newClock = performance.now()
    const oldClock = previousClock
    previousClock = newClock
    return newClock > oldClock ? newClock : oldClock
  }

  // Get timestamps at same point in time
  const startWallTime = Date.now() // Wall time
  const startPerfTime = now() // Measurable "monotonic" time

  return {
    now,
    date: () => new Date(now() + startWallTime - startPerfTime),
    convert: (date: Date) => date.getTime() - startWallTime + startPerfTime,
    // convert milliseconds since timeOrigin to full timestamp
    toUnixTimestampNanoseconds: (time: number) =>
      millisecondsToNanoseconds(
        time - startPerfTime + startWallTime
      ).toString()
  }
}

export default createClock
