import createTestClient from '../create-test-client'
import type { IdGenerator } from '../lib/id-generator'

describe('Span', () => {
  describe('client.startSpan()', () => {
    it('returns a Span', () => {
      const testClient = createTestClient()
      const testSpan = testClient.startSpan('test span')
      expect(testSpan).toStrictEqual({
        end: expect.any(Function)
      })
    })

    it('accepts an optional startTime', () => {
      const testClient = createTestClient()
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
      const testProcessor = { add: jest.fn() }
      const testClient = createTestClient({ processor: testProcessor })
      testClient.start({ apiKey: 'test-api-key' })

      // @ts-expect-error startTime will be invalid
      const span = testClient.startSpan('test span', startTime)
      span.end()

      expect(testProcessor.add).toHaveBeenCalledWith(expect.objectContaining({
        startTime: expect.any(Number) // TODO: this can be stricter when we have a clock
      }))
    })
  })

  describe('Span.end()', () => {
    it('can be ended without an endTime', () => {
      const processor = { add: jest.fn() }
      const idGenerator: IdGenerator = { generate: bits => `a random ${bits} bit string` }
      const testClient = createTestClient({ processor, idGenerator })

      const testSpan = testClient.startSpan('test span')
      testSpan.end()

      expect(processor.add).toHaveBeenCalledWith({
        id: 'a random 64 bit string',
        traceId: 'a random 128 bit string',
        kind: 'client',
        name: 'test span',
        startTime: expect.any(Number), // TODO: this can be stricter when we have a clock
        endTime: expect.any(Number) // TODO: this can be stricter when we have a clock
      })

      expect(processor.add).toHaveBeenCalledTimes(1)
    })

    it('accepts a Date object as endTime', () => {
      const processor = { add: jest.fn() }
      const idGenerator: IdGenerator = { generate: bits => `a random ${bits} bit string` }
      const testClient = createTestClient({ processor, idGenerator })

      const testSpan = testClient.startSpan('test span')
      testSpan.end(new Date('2023-01-02T03:04:05.006Z'))

      expect(processor.add).toHaveBeenCalledWith({
        id: 'a random 64 bit string',
        traceId: 'a random 128 bit string',
        kind: 'client',
        name: 'test span',
        startTime: expect.any(Number), // TODO: this can be stricter when we have a clock
        endTime: 1672628645006000000 // 2023-01-02T03:04:05.006Z in nanoseconds
      })

      expect(processor.add).toHaveBeenCalledTimes(1)
    })

    it('accepts a number of nanoseconds as endTime', () => {
      const processor = { add: jest.fn() }
      const idGenerator: IdGenerator = { generate: bits => `a random ${bits} bit string` }
      const testClient = createTestClient({ processor, idGenerator })

      const testSpan = testClient.startSpan('test span')
      testSpan.end(12345)

      expect(processor.add).toHaveBeenCalledWith({
        id: 'a random 64 bit string',
        traceId: 'a random 128 bit string',
        kind: 'client',
        name: 'test span',
        startTime: expect.any(Number), // TODO: this can be stricter when we have a clock
        endTime: 12345
      })

      expect(processor.add).toHaveBeenCalledTimes(1)
    })
  })
})
