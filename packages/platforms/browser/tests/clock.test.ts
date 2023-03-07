/**
 * @jest-environment jsdom
 */

import createClock from '../lib/clock'

describe('Browser Clock', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  describe('clock.now()', () => {
    it('returns a number', () => {
      const clock = createClock(performance)

      expect(clock.now()).toBeGreaterThan(0)
    })

    it('returns a greater number on every invocation (100 runs)', () => {
      let lastTime = 0

      for (let i = 0; i < 100; i++) {
        const clock = createClock(performance)
        const newTime = clock.now()

        expect(newTime).toBeGreaterThan(lastTime)
        lastTime = newTime
      }
    })
  })

  describe('clock.convert()', () => {
    it('converts a Date into a number', () => {
      const clock = createClock(performance)
      const convertedTime = clock.convert(new Date())

      expect(convertedTime).toEqual(expect.any(Number))
    })

    it('returns the difference between provided Date and performance.timeOrigin in nanoseconds', () => {
      const performance = {
        now: () => 1234,
        timeOrigin: new Date('2023-01-02T00:00:00.000Z').getTime(),
        timing: {
          // this is different to the above date, so we know which is being used
          navigationStart: new Date('2022-01-01T00:00:00.000Z').getTime()
        }
      }

      const clock = createClock(performance)
      const time = new Date('2023-01-02T00:00:00.002Z')

      expect(clock.convert(time)).toEqual(2_000_000) // 2ms difference = 2 million nanos
    })

    it('works when performance.timeOrigin is not defined', () => {
      const performance = {
        now: () => 1234,
        timing: {
          navigationStart: new Date('2023-01-01T00:00:00.000Z').getTime()
        }
      }

      const clock = createClock(performance)
      const time = new Date('2023-01-01T00:00:00.015Z')

      expect(clock.convert(time)).toEqual(15_000_000) // 15ms difference = 15 million nanos
    })
  })
})
