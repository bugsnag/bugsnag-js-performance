import { createClient } from '../lib/core'

describe('Core', () => {
  describe('createClient()', () => {
    it('returns a performance client', () => {
      const testClient = createClient()
      expect(testClient).toMatchObject({
        start: expect.any(Function)
      })
    })

    describe('BugsnagPerformance', () => {
      describe('start()', () => {
        it('accepts a string', () => {
          const testClient = createClient()
          expect(() => { testClient.start('test-api-key') }).not.toThrow()
        })

        it('accepts a minimal valid configuration object', () => {
          const testClient = createClient()
          expect(() => { testClient.start({ apiKey: 'test-api-key' }) }).not.toThrow()
        })

        it('accepts a complete configuration object', () => {
          const testClient = createClient()
          expect(() => { testClient.start({ apiKey: 'test-api-key', endpoint: '/test', releaseStage: 'test' }) }).not.toThrow()
        })

        const invalidParameters = [
          { type: 'bigint', value: BigInt(9007199254740991) },
          { type: 'boolean', value: true },
          { type: 'function', value: () => {} },
          { type: 'number', value: 12345 },
          { type: 'object', value: { property: 'test' } },
          { type: 'object', value: [] },
          { type: 'symbol', value: Symbol('test') }
        ]

        test.each(invalidParameters)('warns if config.endpoint is invalid ($type)', ({ value, type }) => {
          jest.spyOn(console, 'warn')
          const testClient = createClient()
          // @ts-expect-error endpoint should be a string
          testClient.start({ apiKey: 'test-api-key', endpoint: value })
          expect(console.warn).toHaveBeenCalledWith(`Invalid configuration. endpoint should be a string, got ${String(type)}`)
        })

        test.each(invalidParameters)('warns if config.releaseStage is invalid ($type)', ({ value, type }) => {
          jest.spyOn(console, 'warn')
          const testClient = createClient()
          // @ts-expect-error releaseStage should be a string
          testClient.start({ apiKey: 'test-api-key', releaseStage: value })
          expect(console.warn).toHaveBeenCalledWith(`Invalid configuration. releaseStage should be a string, got ${String(type)}`)
        })

        it('throws if no configuration is provided', () => {
          const testClient = createClient()
          // @ts-expect-error no configuration provided
          expect(() => { testClient.start() }).toThrow('No Bugsnag API Key set')
        })

        it.each([
          { type: 'a bigint', config: BigInt(9007199254740991) },
          { type: 'a function', config: () => {} },
          { type: 'a number', config: 12345 },
          { type: 'boolean (true)', config: true },
          { type: 'boolean (false)', config: false },
          { type: 'null', config: null },
          { type: 'an invalid configuration object', config: { property: 'test' } },
          { type: 'an array', config: [] },
          { type: 'a symbol', config: Symbol('test') }
        ])('throws if provided configuration is $type', ({ config }) => {
          const testClient = createClient()
          // @ts-expect-error invalid configuration provided
          expect(() => { testClient.start(config) }).toThrow('No Bugsnag API Key set')
        })
      })
    })
  })
})
