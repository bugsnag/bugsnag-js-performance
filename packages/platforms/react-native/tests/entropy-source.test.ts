import createEntropySource, { fill, shuffle } from '../lib/entropy-source'
import NativeBugsnagPerformance from '../lib/NativeBugsnagPerformance'

jest.useFakeTimers()

describe('React Native entropy source', () => {
  describe('fill', () => {
    it('fills the pool with values between 0 and 255', () => {
      const pool = new Uint8Array(1024)
      fill(pool)

      expect(pool).not.toEqual(new Uint8Array(1024))
      expect(pool.every((value) => value >= 0 && value <= 255)).toBe(true)
    })
  })

  describe('shuffle', () => {
    it('shuffles the pool', () => {
      const pool = new Uint8Array(1024)
      fill(pool)

      const originalPool = pool.slice()
      shuffle(pool)

      expect(pool).not.toEqual(originalPool)
      expect(pool.every((value) => originalPool.includes(value))).toBe(true)
    })
  })

  describe('EntropySource', () => {
    // @ts-expect-error NativeBugsnagPerformance is possibly null
    const requestEntropy = NativeBugsnagPerformance.requestEntropy as jest.MockedFunction<typeof NativeBugsnagPerformance.requestEntropy>
    // @ts-expect-error NativeBugsnagPerformance is possibly null
    const requestEntropyAsync = NativeBugsnagPerformance.requestEntropyAsync as jest.MockedFunction<typeof NativeBugsnagPerformance.requestEntropyAsync>

    beforeEach(() => {
      requestEntropy.mockClear()
      requestEntropyAsync.mockClear()
    })

    it('initialises the pool from the synchronous native entropy source', () => {
      createEntropySource(NativeBugsnagPerformance)
      expect(requestEntropy).toHaveBeenCalled()
      expect(requestEntropyAsync).not.toHaveBeenCalled()
    })

    it('shuffles and regenerates the pool when it is exhausted', async () => {
      const { nextByte } = createEntropySource(NativeBugsnagPerformance)
      const initialSet: number[] = []
      for (let i = 0; i < 1023; i++) {
        initialSet.push(nextByte())
      }

      expect(requestEntropyAsync).not.toHaveBeenCalled()

      // the next call should trigger a shuffle and regeneration
      initialSet.push(nextByte())
      expect(requestEntropyAsync).toHaveBeenCalledTimes(1)

      const secondSet: number[] = []
      for (let i = 0; i < 1024; i++) {
        secondSet.push(nextByte())
      }

      // secondSet should be a shuffled version of initialSet
      expect(secondSet).not.toEqual(initialSet)
      expect(secondSet.every((value) => initialSet.includes(value))).toBe(true)
      expect(requestEntropyAsync).toHaveBeenCalledTimes(2)

      // advance the timer to trigger the async callbacks
      await jest.runOnlyPendingTimersAsync()

      const thirdSet: number[] = []
      for (let i = 0; i < 1024; i++) {
        thirdSet.push(nextByte())
      }

      // the pool should now be regenerated
      expect(thirdSet.every((value) => initialSet.includes(value))).toBe(false)
    })

    it('falls back to JS entropy source if native module is null', () => {
      const { nextByte } = createEntropySource(null)

      const initialSet: number[] = []
      for (let i = 0; i < 1024; i++) {
        initialSet.push(nextByte())
      }

      expect(initialSet).not.toEqual(new Array(1024).fill(0))
      expect(initialSet.every((value) => value >= 0 && value <= 255)).toBe(true)

      const secondSet: number[] = []
      for (let i = 0; i < 1024; i++) {
        secondSet.push(nextByte())
      }

      expect(secondSet).not.toEqual(new Array(1024).fill(0))
      expect(secondSet.every((value) => value >= 0 && value <= 255)).toBe(true)

      // pool regeneration is synchronous when the native module is null
      expect(secondSet).not.toEqual(initialSet)
      expect(secondSet.every((value) => initialSet.includes(value))).toBe(false)
    })

    it('falls back to JS entropy source if native module returns an empty array', async () => {
      requestEntropy.mockReturnValue([])
      requestEntropyAsync.mockResolvedValue([])

      const { nextByte } = createEntropySource(NativeBugsnagPerformance)

      const initialSet: number[] = []
      for (let i = 0; i < 1024; i++) {
        initialSet.push(nextByte())
      }

      expect(initialSet).not.toEqual(new Array(1024).fill(0))
      expect(initialSet.every((value) => value >= 0 && value <= 255)).toBe(true)

      const secondSet: number[] = []
      for (let i = 0; i < 1024; i++) {
        secondSet.push(nextByte())
      }

      expect(secondSet).not.toEqual(new Array(1024).fill(0))
      expect(secondSet).not.toEqual(initialSet)
      expect(secondSet.every((value) => initialSet.includes(value))).toBe(true)

      // advance the timer to trigger the async callbacks
      await jest.runOnlyPendingTimersAsync()

      const thirdSet: number[] = []
      for (let i = 0; i < 1024; i++) {
        thirdSet.push(nextByte())
      }

      // the pool should now be regenerated
      expect(thirdSet.every((value) => initialSet.includes(value))).toBe(false)
    })
  })
})
