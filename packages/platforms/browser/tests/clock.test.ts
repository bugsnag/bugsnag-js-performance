/**
 * @jest-environment jsdom
 */

import { ControllableBackgroundingListener } from '@bugsnag/js-performance-test-utilities'
import createClock from '../lib/clock'
import { PerformanceFake } from './utilities'

jest.useFakeTimers()

describe('Browser Clock', () => {
  describe('clock.now()', () => {
    it('returns a number', async () => {
      const clock = createClock(new PerformanceFake(), new ControllableBackgroundingListener())

      await jest.advanceTimersByTimeAsync(100)

      expect(clock.now()).toEqual(100)
    })

    it('returns a greater number on every invocation (100 runs)', async () => {
      let lastTime = 0
      const clock = createClock(new PerformanceFake(), new ControllableBackgroundingListener())

      for (let i = 0; i < 100; i++) {
        await jest.advanceTimersByTimeAsync(10)

        const newTime = clock.now()

        expect(newTime).toEqual(lastTime + 10)
        lastTime = newTime
      }
    })
  })

  describe('clock.date()', () => {
    it('returns a Date', async () => {
      const timeOrigin = new Date('2023-01-02T00:00:00.000Z')
      jest.setSystemTime(timeOrigin)

      const clock = createClock(new PerformanceFake(), new ControllableBackgroundingListener())

      await jest.advanceTimersByTimeAsync(100)

      expect(clock.date()).toEqual(new Date(timeOrigin.getTime() + 100))
    })

    it('returns a greater date on every invocation (100 runs)', async () => {
      const timeOrigin = new Date('2023-01-02T00:00:00.000Z')
      jest.setSystemTime(timeOrigin)

      let lastDate = timeOrigin
      const clock = createClock(new PerformanceFake(), new ControllableBackgroundingListener())

      for (let i = 0; i < 100; i++) {
        await jest.advanceTimersByTimeAsync(10)

        const newDate = clock.date()

        expect(newDate).toEqual(new Date(lastDate.getTime() + 10))
        lastDate = newDate
      }
    })
  })

  describe('clock.convert()', () => {
    it('converts a Date into a number', () => {
      const clock = createClock(new PerformanceFake(), new ControllableBackgroundingListener())
      const convertedTime = clock.convert(new Date())

      expect(convertedTime).toEqual(expect.any(Number))
    })

    it('returns the difference between provided Date and performance.timeOrigin in milliseconds', () => {
      jest.setSystemTime(new Date('2023-01-02T00:00:00.000Z'))

      const performance = new PerformanceFake()

      const clock = createClock(performance, new ControllableBackgroundingListener())
      const time = new Date('2023-01-02T00:00:00.002Z')

      expect(clock.convert(time)).toEqual(2) // 2ms difference
    })

    it('works when performance.timeOrigin is not defined', () => {
      jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'))

      const performance = new PerformanceFake({ timeOrigin: undefined })

      const clock = createClock(performance, new ControllableBackgroundingListener())
      const time = new Date('2023-01-01T00:00:00.015Z')

      // undefined timeOrigin should fall back to using navigationStart (set from system time)
      expect(clock.convert(time)).toEqual(15) // 15 ms difference
    })

    it('works when performance.timeOrigin is 0', () => {
      jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'))

      const performance = new PerformanceFake({ timeOrigin: 0 })

      const clock = createClock(performance, new ControllableBackgroundingListener())
      const time = new Date('2023-01-01T00:00:00.015Z')

      // 0 timeOrigin is valid and should be used
      expect(clock.convert(time)).toEqual(1672531200015) // offset from 0 and not system time
    })

    it('recalculates time origin when foregrounded if it has diverged more than 5 minutes', () => {
      // fake performance with its own internal 'clock'
      const performanceClockTime = new Date('2023-01-01T00:00:00.000Z')
      const initialTimeOrigin = performanceClockTime.getTime()
      const performanceFake = {
        timeOrigin: initialTimeOrigin,
        timing: { navigationStart: initialTimeOrigin },
        now () {
          return performanceClockTime.getTime() - initialTimeOrigin
        }
      }

      const backgroundingListener = new ControllableBackgroundingListener()
      const clock = createClock(performanceFake, backgroundingListener)

      // performance clock and system clock are in sync to start
      jest.setSystemTime(performanceClockTime)
      expect(performanceFake.now()).toEqual(0)
      expect(clock.convert(new Date())).toEqual(0)

      // machine 'sleeps' for  exactly 5 mins
      // system clock updates but performance clock has diverged by 5 mins
      jest.setSystemTime(new Date('2023-01-01T00:05:00.000Z'))
      backgroundingListener.sendToForeground()

      expect(clock.convert(new Date())).toEqual(300000) // 5 minutes

      // performance clock diverges from system clock by > 5 minutes
      jest.setSystemTime(new Date('2023-01-01T00:05:00.001Z'))
      backgroundingListener.sendToForeground()

      // performance clock has diverged sufficiently from system time
      // so timeOrigin has been recalculated from Date.now()
      expect(clock.convert(new Date())).toEqual(0)
    })

    it('recalculates time origin on start if it has diverged more than 5 minutes', () => {
      // fake performance with its own internal 'clock'
      const performanceClockTime = new Date('2023-01-01T00:00:00.000Z')
      const initialTimeOrigin = performanceClockTime.getTime()
      const performanceFake = {
        timeOrigin: initialTimeOrigin,
        timing: { navigationStart: initialTimeOrigin },
        now () {
          return performanceClockTime.getTime() - initialTimeOrigin
        }
      }

      // performance clock is > 5 minutes behind the system time
      jest.setSystemTime(new Date('2023-01-01T00:05:00.001Z'))

      const backgroundingListener = new ControllableBackgroundingListener()
      const clock = createClock(performanceFake, backgroundingListener)

      // timeOrigin should be recalculated from Date.now()
      expect(clock.convert(new Date())).toEqual(0)
    })
  })
})
