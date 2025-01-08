import createIdGenerator, { toHex, createRandomString } from '../lib/id-generator'
import NativeBugsnagPerformance from '../lib/native'

jest.useFakeTimers()

describe('React Native ID generator', () => {
  describe('toHex', () => {
    const values: Array<{ value: number, expected: string }> = [
      { value: 0, expected: '00' },
      { value: 1, expected: '01' },
      { value: 10, expected: '0a' },
      { value: 15, expected: '0f' },
      { value: 16, expected: '10' },
      { value: 255, expected: 'ff' }
    ]

    it.each(values)('converts a number to a hex string', () => {
      const { value, expected } = values[0]
      expect(toHex(value)).toBe(expected)
    })
  })

  describe('createRandomString', () => {
    it('generates a 2048 character string', () => {
      const random = createRandomString()
      expect(random).toMatch(/^[a-f0-9]{2048}$/)
    })
  })

  describe('idGenerator', () => {
    const requestEntropy = NativeBugsnagPerformance.requestEntropy as jest.MockedFunction<typeof NativeBugsnagPerformance.requestEntropy>
    const requestEntropyAsync = NativeBugsnagPerformance.requestEntropyAsync as jest.MockedFunction<typeof NativeBugsnagPerformance.requestEntropyAsync>

    beforeEach(() => {
      requestEntropy.mockClear()
      requestEntropyAsync.mockClear()
    })

    it('generates random 64 bit ID', () => {
      const idGenerator = createIdGenerator()
      const id = idGenerator.generate(64)

      expect(id).toMatch(/^[a-f0-9]{16}$/)
    })

    it('generates random 128 bit ID', () => {
      const idGenerator = createIdGenerator()
      const id = idGenerator.generate(128)

      expect(id).toMatch(/^[a-f0-9]{32}$/)
    })

    it('initialises the pool from the synchronous native entropy source', () => {
      createIdGenerator()
      expect(requestEntropy).toHaveBeenCalled()
      expect(requestEntropyAsync).not.toHaveBeenCalled()
    })

    it('regenerates the pool after 1000 calls', async () => {
      const idGenerator = createIdGenerator()

      for (let i = 0; i < 999; i++) {
        const id = idGenerator.generate(64)
        expect(id).toMatch(/^[a-f0-9]{16}$/)
      }

      expect(requestEntropyAsync).not.toHaveBeenCalled()
      const id = idGenerator.generate(64)
      expect(id).toMatch(/^[a-f0-9]{16}$/)
      expect(requestEntropyAsync).toHaveBeenCalled()
    })

    it('falls back to JS entropy source if native module returns an empty string', async () => {
      requestEntropy.mockReturnValueOnce('')
      requestEntropyAsync.mockResolvedValueOnce('')

      const idGenerator = createIdGenerator()
      expect(requestEntropy).toHaveBeenCalled()

      for (let i = 0; i < 1000; i++) {
        const id = idGenerator.generate(64)
        expect(id).toMatch(/^[a-f0-9]{16}$/)
      }

      expect(requestEntropyAsync).toHaveBeenCalled()

      // advance the timer to trigger the async callback
      await jest.runOnlyPendingTimersAsync()

      const id = idGenerator.generate(64)
      expect(id).toMatch(/^[a-f0-9]{16}$/)
    })

    it('falls back to JS entropy source if remote debugging is enabled', () => {
      // ensuring the native module is "loaded" and returns some not empty value
      requestEntropy.mockReturnValue('a3b9c8d7e6f5g4h2')
      requestEntropyAsync.mockResolvedValue('a3b9c8d7e6f5g4h2')

      const idGenerator = createIdGenerator(true)
      expect(requestEntropy).not.toHaveBeenCalled()
      const id = idGenerator.generate(64)
      expect(id).toMatch(/^[a-f0-9]{16}$/)
    })
  })

  // Test written here so it does not clash with native module jest override
  describe('React Native turbomodule is not null so implementation uses turbomodule', () => {
    it('getDeviceInfo returns expected values', () => {
      expect(NativeBugsnagPerformance.getDeviceInfo()).toStrictEqual({
        arch: 'arm64',
        model: 'iPhone14,1',
        bundleVersion: '12345',
        bundleIdentifier: 'my.cool.app'
      })
    })

    it('getNativeConstants returns expected values', () => {
      expect(NativeBugsnagPerformance.getNativeConstants()).toStrictEqual({ CacheDir: '/mock/CacheDir', DocumentDir: '/mock/DocumentDir' })
    })
  })
})
