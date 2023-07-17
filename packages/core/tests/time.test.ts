import { IncrementingClock } from '@bugsnag/js-performance-test-utilities'
import { timeToNumber } from '../lib/time'

describe('timeToNumber', () => {
  it('converts Date into a number', () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00.000Z')
    const number = timeToNumber(clock, new Date('1970-01-01T00:00:00.100Z'))
    expect(number).toBe(100)
  })

  it('accepts a real number', () => {
    const clock = new IncrementingClock()
    const number = timeToNumber(clock, 1234)

    expect(number).toBe(1234)
  })

  it.each([NaN, Infinity, -Infinity])('ignores %s and uses clock.now()', (time) => {
    const clock = new IncrementingClock()
    const number = timeToNumber(clock, time)

    expect(number).toBe(1)
  })
})
