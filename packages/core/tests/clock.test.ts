import { millisecondsToNanoseconds, nanosecondsToMilliseconds } from '../lib/clock'

describe('millisecondsToNanoseconds', () => {
  it('rounds to the nearest nanosecond', () => {
    expect(millisecondsToNanoseconds(123456789.1122345)).toEqual(123456789_112235)
    expect(millisecondsToNanoseconds(123456789.1122344)).toEqual(123456789_112234)
  })
})

describe('nanosecodsToMilliseconds', () => {
  it('converts nanoseconds to milliseconds', () => {
    expect(nanosecondsToMilliseconds(123456789_112235)).toEqual(123456789.112235)
  })
})
