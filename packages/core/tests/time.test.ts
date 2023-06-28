import { IncrementingClock } from '@bugsnag/js-performance-test-utilities'
import { timeToNumber } from '../lib/time'

describe('timeToNumber', () => {
  it('converts Date into a number', () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00.000Z')
    const number = timeToNumber(clock, new Date('1970-01-01T00:00:00.100Z'))
    expect(number).toBe(100)
  })

  it('accepts a real number', () => {
    const clock = { now: jest.fn(() => 1), convert: jest.fn(), toUnixTimestampNanoseconds: jest.fn() }
    const number = timeToNumber(clock, 1234)
    expect(clock.now).not.toHaveBeenCalled()
    expect(number).toBe(1234)
  })

  it.each([NaN, Infinity, -Infinity])('ignores %s and uses clock.now()', (time) => {
    const clock = { now: jest.fn(() => 1), convert: jest.fn(), toUnixTimestampNanoseconds: jest.fn() }
    const number = timeToNumber(clock, time)
    expect(clock.now).toHaveBeenCalled()
    expect(number).toBe(1)
  })
})
