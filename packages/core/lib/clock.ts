export interface Clock {
  // number will be accurate until the page has been open for more than 104.25 days
  // returns nanoseconds since load
  now: () => number

  // a function to convert a Date object into the format returned by 'now'
  convert: (date: Date) => number
}
