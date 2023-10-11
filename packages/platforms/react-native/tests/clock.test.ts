import createClock from '../lib/clock'

// reset timer between tests
beforeEach(() => {
  jest.useFakeTimers()
})

describe('React Native Clock', () => {
  describe('clock.now()', () => {
    it('returns a number', async () => {
      jest.setSystemTime(0)
      const clock = createClock(performance)

      await jest.advanceTimersByTimeAsync(100)

      expect(clock.now()).toEqual(100)
    })

    it('returns a greater number on every invocation (100 runs)', async () => {
      jest.setSystemTime(0)
      let lastTime = 0
      const clock = createClock(performance)

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
      const timeOrigin = new Date('2023-01-02T00:00:00.000Z').getTime()
      jest.setSystemTime(timeOrigin)

      const clock = createClock(performance)

      await jest.advanceTimersByTimeAsync(100)

      const advancedDate = new Date(timeOrigin + 100)
      expect(clock.date()).toEqual(advancedDate)
    })

    it('returns a greater date on every invocation (100 runs)', async () => {
      const timeOrigin = new Date('2023-01-02T00:00:00.000Z')
      jest.setSystemTime(timeOrigin)

      let lastDate = timeOrigin
      const clock = createClock(performance)

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
      const clock = createClock(performance)
      const convertedTime = clock.convert(new Date())

      expect(convertedTime).toEqual(expect.any(Number))
    })

    it('returns the difference between provided Date and performance.timeOrigin in milliseconds', () => {
      const timeOrigin = new Date('2023-01-02T00:00:00.000Z')
      jest.setSystemTime(timeOrigin)

      const clock = createClock(performance)
      const time = new Date('2023-01-02T00:00:00.002Z')

      expect(clock.convert(time)).toEqual(2) // 2ms difference
    })
  })

  describe('clock.toUnixTimestampNanoseconds()', () => {
    it('converts a time to a valid timestamp', () => {
      const timeOrigin = new Date('1970-01-01T00:00:00.000Z')
      jest.setSystemTime(timeOrigin)

      const clock = createClock(performance)

      jest.advanceTimersByTime(69)

      const startTime = clock.now()
      const unixTimeStamp = clock.toUnixTimestampNanoseconds(startTime)

      expect(unixTimeStamp).toBe('69000000')
    })
  })
})
