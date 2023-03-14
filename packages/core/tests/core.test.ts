import { createNoopClient } from '../lib/core'
import { createTestClient, VALID_API_KEY } from './utilities'

describe('Core', () => {
  describe('createClient()', () => {
    it('returns a BugsnagPerformance client', () => {
      const client = createTestClient()

      expect(client).toStrictEqual({
        start: expect.any(Function),
        startSpan: expect.any(Function)
      })
    })

    describe('BugsnagPerformance', () => {
      describe('start()', () => {
        beforeEach(() => {
          jest.restoreAllMocks()
          jest.spyOn(console, 'debug')
          jest.spyOn(console, 'info')
          jest.spyOn(console, 'warn')
          jest.spyOn(console, 'error')
        })

        it('accepts a string', () => {
          const client = createTestClient()

          client.start(VALID_API_KEY)

          expect(console.warn).not.toHaveBeenCalled()
        })

        it('accepts a minimal valid configuration object', () => {
          const client = createTestClient()

          client.start({ apiKey: VALID_API_KEY })

          expect(console.warn).not.toHaveBeenCalled()
        })

        it('accepts a complete configuration object', () => {
          const client = createTestClient()

          const logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
          }

          client.start({
            apiKey: VALID_API_KEY,
            endpoint: '/test',
            releaseStage: 'test',
            logger
          })

          expect(logger.warn).not.toHaveBeenCalled()
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

        it.each(invalidParameters)('warns if config.endpoint is invalid ($type)', ({ value, type }) => {
          jest.spyOn(console, 'warn').mockImplementation()

          const client = createTestClient()

          // @ts-expect-error endpoint should be a string
          client.start({ apiKey: VALID_API_KEY, endpoint: value })
          expect(console.warn).toHaveBeenCalledWith(`Invalid configuration. endpoint should be a string, got ${type}`)
        })

        it.each(invalidParameters)('warns if config.releaseStage is invalid ($type)', ({ value, type }) => {
          jest.spyOn(console, 'warn').mockImplementation()

          const client = createTestClient()

          // @ts-expect-error releaseStage should be a string
          client.start({ apiKey: VALID_API_KEY, releaseStage: value })
          expect(console.warn).toHaveBeenCalledWith(`Invalid configuration. releaseStage should be a string, got ${type}`)
        })

        it.each(invalidParameters)('warns if config.logger is invalid ($type)', ({ value, type }) => {
          jest.spyOn(console, 'warn').mockImplementation()

          const client = createTestClient()

          // @ts-expect-error logger should be a logger object
          client.start({ apiKey: VALID_API_KEY, logger: value })
          expect(console.warn).toHaveBeenCalledWith(`Invalid configuration. logger should be a Logger object, got ${type}`)
        })

        it.each(invalidParameters)('uses config.logger if it is valid', ({ value, type }) => {
          const client = createTestClient()

          const logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
          }

          // @ts-expect-error logger should be a logger object
          client.start({ apiKey: VALID_API_KEY, logger, endpoint: value, releaseStage: value })

          expect(logger.warn).toHaveBeenCalledWith(`Invalid configuration. endpoint should be a string, got ${type}`)
          expect(logger.warn).toHaveBeenCalledWith(`Invalid configuration. releaseStage should be a string, got ${type}`)
        })

        it('throws if no configuration is provided', () => {
          const client = createTestClient()

          // @ts-expect-error no configuration provided
          expect(() => { client.start() }).toThrow('No Bugsnag API Key set')
        })

        it.each([
          { type: 'a bigint', config: BigInt(9007199254740991) },
          { type: 'a function', config: () => {} },
          { type: 'a number', config: 12345 },
          { type: 'a date', config: new Date() },
          { type: 'boolean (true)', config: true },
          { type: 'boolean (false)', config: false },
          { type: 'null', config: null },
          { type: 'an invalid configuration object', config: { property: 'test' } },
          { type: 'an array', config: [] },
          { type: 'a symbol', config: Symbol('test') }
        ])('throws if provided configuration is $type', ({ config }) => {
          const client = createTestClient()

          // @ts-expect-error invalid configuration provided
          expect(() => { client.start(config) }).toThrow('No Bugsnag API Key set')
        })
      })
    })
  })

  describe('createNoopClient', () => {
    it('implements the expected API (minimal arguments)', () => {
      expect(() => {
        const client = createNoopClient()
        client.start('api key')

        const span = client.startSpan('name')
        span.end()
      }).not.toThrow()
    })

    it('implements the expected API (all arguments)', () => {
      expect(() => {
        const client = createNoopClient()
        client.start({
          apiKey: '1234',
          endpoint: 'https://example.bugsnag.com',
          releaseStage: 'staging'
        })

        const span = client.startSpan('name', new Date())
        span.end()
      }).not.toThrow()
    })
  })
})
