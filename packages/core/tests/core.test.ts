import { createClient } from '../lib/core'
import { InMemoryProcessor, StableIdGenerator, IncrementingClock } from './utilities'

describe('Core', () => {
  describe('createClient()', () => {
    it('returns a BugsnagPerformance client', () => {
      const client = createClient({
        processor: new InMemoryProcessor(),
        idGenerator: new StableIdGenerator(),
        clock: new IncrementingClock()
      })

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
          const client = createClient({
            processor: new InMemoryProcessor(),
            idGenerator: new StableIdGenerator(),
            clock: new IncrementingClock()
          })

          client.start('test-api-key')

          expect(console.warn).not.toHaveBeenCalled()
        })

        it('accepts a minimal valid configuration object', () => {
          const client = createClient({
            processor: new InMemoryProcessor(),
            idGenerator: new StableIdGenerator(),
            clock: new IncrementingClock()
          })

          client.start({ apiKey: 'test-api-key' })

          expect(console.warn).not.toHaveBeenCalled()
        })

        it('accepts a complete configuration object', () => {
          const client = createClient({
            processor: new InMemoryProcessor(),
            idGenerator: new StableIdGenerator(),
            clock: new IncrementingClock()
          })

          const logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
          }

          client.start({
            apiKey: 'test-api-key',
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

        test.each(invalidParameters)('warns if config.endpoint is invalid ($type)', ({ value, type }) => {
          jest.spyOn(console, 'warn').mockImplementation()

          const client = createClient({
            processor: new InMemoryProcessor(),
            idGenerator: new StableIdGenerator(),
            clock: new IncrementingClock()
          })

          // @ts-expect-error endpoint should be a string
          client.start({ apiKey: 'test-api-key', endpoint: value })
          expect(console.warn).toHaveBeenCalledWith(`Invalid configuration. endpoint should be a string, got ${type}`)
        })

        test.each(invalidParameters)('warns if config.releaseStage is invalid ($type)', ({ value, type }) => {
          jest.spyOn(console, 'warn').mockImplementation()

          const client = createClient({
            processor: new InMemoryProcessor(),
            idGenerator: new StableIdGenerator(),
            clock: new IncrementingClock()
          })

          // @ts-expect-error releaseStage should be a string
          client.start({ apiKey: 'test-api-key', releaseStage: value })
          expect(console.warn).toHaveBeenCalledWith(`Invalid configuration. releaseStage should be a string, got ${type}`)
        })

        test.each(invalidParameters)('warns if config.logger is invalid ($type)', ({ value, type }) => {
          jest.spyOn(console, 'warn').mockImplementation()

          const client = createClient({
            processor: new InMemoryProcessor(),
            idGenerator: new StableIdGenerator(),
            clock: new IncrementingClock()
          })

          // @ts-expect-error logger should be a logger object
          client.start({ apiKey: 'test-api-key', logger: value })
          expect(console.warn).toHaveBeenCalledWith(`Invalid configuration. logger should be a Logger object, got ${type}`)
        })

        test.each(invalidParameters)('uses config.logger if it is valid', ({ value, type }) => {
          const client = createClient({
            processor: new InMemoryProcessor(),
            idGenerator: new StableIdGenerator(),
            clock: new IncrementingClock()
          })

          const logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
          }

          // @ts-expect-error logger should be a logger object
          client.start({ apiKey: 'test-api-key', logger, endpoint: value, releaseStage: value })

          expect(logger.warn).toHaveBeenCalledWith(`Invalid configuration. endpoint should be a string, got ${type}`)
          expect(logger.warn).toHaveBeenCalledWith(`Invalid configuration. releaseStage should be a string, got ${type}`)
        })

        it('throws if no configuration is provided', () => {
          const client = createClient({
            processor: new InMemoryProcessor(),
            idGenerator: new StableIdGenerator(),
            clock: new IncrementingClock()
          })

          // @ts-expect-error no configuration provided
          expect(() => { client.start() }).toThrow('No Bugsnag API Key set')
        })

        test.each([
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
          const client = createClient({
            processor: new InMemoryProcessor(),
            idGenerator: new StableIdGenerator(),
            clock: new IncrementingClock()
          })

          // @ts-expect-error invalid configuration provided
          expect(() => { client.start(config) }).toThrow('No Bugsnag API Key set')
        })
      })
    })
  })
})
