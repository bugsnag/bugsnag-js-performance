import createClock from './clock'

// reset timer between tests
beforeEach(() => {
  jest.useFakeTimers()
})

describe('React Native Clock', () => {
  describe('clock.now()', () => {
    it('returns a number', async () => {
      const clock = createClock(0, performance)

      await jest.advanceTimersByTimeAsync(100)

      expect(clock.now()).toEqual(100)
    })

    it('returns a greater number on every invocation (100 runs)', async () => {
      let lastTime = 0
      const clock = createClock(0, performance)

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

      const clock = createClock(timeOrigin, performance)

      await jest.advanceTimersByTimeAsync(100)

      const advancedDate = new Date(timeOrigin + 100)
      expect(clock.date()).toEqual(advancedDate)
    })

    it('returns a greater date on every invocation (100 runs)', async () => {
      const timeOrigin = new Date('2023-01-02T00:00:00.000Z')

      let lastDate = timeOrigin
      const clock = createClock(timeOrigin.getTime(), performance)

      for (let i = 0; i < 100; i++) {
        await jest.advanceTimersByTimeAsync(10)

        const newDate = clock.date()

        expect(newDate).toEqual(new Date(lastDate.getTime() + 10))
        lastDate = newDate
      }
    })
  })
})
