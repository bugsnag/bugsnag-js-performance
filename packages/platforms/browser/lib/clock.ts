import { type Clock } from '@bugsnag/js-performance-core'

const NANOSECONDS_IN_MILLISECONDS = 1_000_000

function millisecondsToNanoseconds (milliseconds: number): number {
  return milliseconds * NANOSECONDS_IN_MILLISECONDS
}

function createClock (performance: Performance): Clock {
  return {
    now: () => performance.now(),
    convert: (date) => millisecondsToNanoseconds(date.getTime() - performance.timeOrigin),
    // convert nanoseconds since timeOrigin to full timestamp
    toUnixTimestampNanoseconds: (time: number) => time + performance.timeOrigin
  }
}

export default createClock
