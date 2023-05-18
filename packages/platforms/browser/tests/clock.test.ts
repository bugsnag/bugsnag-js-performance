/**
 * @jest-environment jsdom
 */

import createClock from '../lib/clock'
import { PerformanceFake } from './utilities'

jest.useFakeTimers()

describe('Browser Clock', () => {
  describe('clock.now()', () => {
    it('returns a number', async () => {
      const clock = createClock(new PerformanceFake())

      await jest.advanceTimersByTimeAsync(100)

      expect(clock.now()).toEqual(100)
    })

    it('returns a greater number on every invocation (100 runs)', async () => {
      let lastTime = 0
      const clock = createClock(new PerformanceFake())

      for (let i = 0; i < 100; i++) {
        await jest.advanceTimersByTimeAsync(10)

        const newTime = clock.now()

        expect(newTime).toEqual(lastTime + 10)
        lastTime = newTime
      }
    })
  })

  describe('clock.convert()', () => {
    it('converts a Date into a number', () => {
      const clock = createClock(new PerformanceFake())
      const convertedTime = clock.convert(new Date())

      expect(convertedTime).toEqual(expect.any(Number))
    })

    it('returns the difference between provided Date and performance.timeOrigin in milliseconds', () => {
      jest.setSystemTime(new Date('2023-01-02T00:00:00.000Z'))

      const performance = new PerformanceFake()

      const clock = createClock(performance)
      const time = new Date('2023-01-02T00:00:00.002Z')

      expect(clock.convert(time)).toEqual(2) // 2ms difference
    })

    it('works when performance.timeOrigin is not defined', () => {
      jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'))

      const performance = new PerformanceFake({ timeOrigin: undefined })

      const clock = createClock(performance)
      const time = new Date('2023-01-01T00:00:00.015Z')

      expect(clock.convert(time)).toEqual(15) // 15ms difference
    })
  })
})
