export interface Clock {
  // returns a platform-specific value representing the current time
  // this could be an absolute timestamp, a time relative to a "time origin"
  // or any other number, so long as it is consistent to the platform
  now: () => number

  // a function to convert a Date object into the format returned by 'now'
  convert: (date: Date) => number
}
