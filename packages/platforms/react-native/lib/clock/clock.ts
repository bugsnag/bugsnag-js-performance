import { millisecondsToNanoseconds, type Clock } from '@bugsnag/core-performance'

function createClock (timeOrigin: number, performance: Performance): Clock {
  return {
    now: () => performance.now(),
    date: () => new Date(timeOrigin + performance.now()),
    convert: (date) => date.getTime() - timeOrigin,
    // convert milliseconds since timeOrigin to full timestamp
    toUnixTimestampNanoseconds: (time) => millisecondsToNanoseconds(timeOrigin + time).toString()
  }
}

export default createClock
