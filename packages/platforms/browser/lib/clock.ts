import { type Clock } from '@bugsnag/js-performance-core'

const NANOSECONDS_IN_MILLISECONDS = 1_000_000

export function millisecondsToNanoseconds (milliseconds: number): number {
  return milliseconds * NANOSECONDS_IN_MILLISECONDS
}

export const clock: Clock = {
  now: () => performance.now(), // nanoseconds passed since performance.timeOrigin
  convert: (date) => millisecondsToNanoseconds(date.getTime() - performance.timeOrigin),
  toUnixTimestampNanoseconds: (time: number) => time + performance.timeOrigin // convert nanoseconds since timeOrigin to full timeStamp
}

export default clock
