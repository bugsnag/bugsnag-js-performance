import { createClient } from '../lib/core'

describe('Span', () => {
  describe('client.startSpan()', () => {
    it('returns a Span', () => {
      const testProcessor = { add: jest.fn() }
      const testClient = createClient({ processor: testProcessor })
      const testSpan = testClient.startSpan('test span')
      expect(testSpan).toStrictEqual({
        end: expect.any(Function)
      })
    })

    it('accepts an optional startTime', () => {
      const testProcessor = { add: jest.fn() }
      const testClient = createClient({ processor: testProcessor })
      const startTime = new Date()
      expect(() => {
        testClient.startSpan('test span', startTime)
      }).not.toThrow()
    })

    test.each([
      { type: 'string', startTime: 'i am not a startTime' },
      { type: 'bigint', startTime: BigInt(9007199254740991) },
      { type: 'boolean', startTime: true },
      { type: 'function', startTime: () => {} },
      { type: 'number', startTime: 12345 },
      { type: 'object', startTime: { property: 'test' } },
      { type: 'object', startTime: [] },
      { type: 'symbol', startTime: Symbol('test') }
    ])('uses default clock implementation if startTime is invalid ($type)', ({ startTime }) => {
      jest.spyOn(console, 'warn').mockImplementation()
      const testProcessor = { add: jest.fn() }
      // TODO: Add clock implementation
      const testClient = createClient({ processor: testProcessor })
      testClient.start({ apiKey: 'test-api-key' })
      // @ts-expect-error startTime will be invalid
      const span = testClient.startSpan('test span', startTime)
      span.end()
      expect(testProcessor.add).toHaveBeenCalledWith(expect.objectContaining({
        startTime: expect.any(Number)
      }))
    })
  })

  describe('Span.end()', () => {
    it('can be ended without an endTime', () => {
      const testProcessor = { add: jest.fn() }
      const testClient = createClient({ processor: testProcessor })
      const testSpan = testClient.startSpan('test span')
      expect(() => { testSpan.end() }).not.toThrow()
    })

    it('accepts a valid Date as endTime', () => {
      const testProcessor = { add: jest.fn() }
      const testClient = createClient({ processor: testProcessor })
      const testSpan = testClient.startSpan('test span')
      const endTime = new Date()
      expect(() => { testSpan.end(endTime) }).not.toThrow()
    })
  })
})
