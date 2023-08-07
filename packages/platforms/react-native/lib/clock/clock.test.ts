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
})
