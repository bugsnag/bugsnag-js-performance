const NANOSECONDS_IN_MILLISECONDS = 1_000_000

export function millisecondsToNanoseconds (milliseconds: number): number {
  return milliseconds * NANOSECONDS_IN_MILLISECONDS
}

export interface Clock {
  // returns a platform-specific value representing the current time
  // this could be an absolute timestamp, a time relative to a "time origin"
  // or any other number, so long as it is consistent to the platform
  now: () => number

  // a function to convert a Date object into the format returned by 'now'
  convert: (date: Date) => number

  // convert the format returned by 'now' into a unix timestamp in nanoseconds
  toUnixTimestampNanoseconds: (time: number) => number
}
