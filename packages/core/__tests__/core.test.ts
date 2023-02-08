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

        it('throws if no configuration is provided', () => {
          const testClient = createClient()
          // @ts-expect-error no configuration provided
          expect(() => { testClient.start() }).toThrow('No Bugsnag API Key set')
        })

        it.each([
          [],
          { invalidConfiguration: 'test' },
          null,
          true,
          false,
          1,
          Symbol('test symbol')
        ])('throws if provided configuration is %s', (config) => {
          const testClient = createClient()
          // @ts-expect-error invalid configuration provided
          expect(() => { testClient.start(config) }).toThrow('No Bugsnag API Key set')
        })
      })
    })
  })
})
