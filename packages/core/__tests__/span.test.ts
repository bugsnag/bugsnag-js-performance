import createTestClient from '../create-test-client'
import type { IdGenerator } from '../lib/id-generator'

describe('Span', () => {
  describe('client.startSpan()', () => {
    it('returns a Span', () => {
      const testClient = createTestClient()
      const testSpan = testClient.startSpan('test span')
      expect(testSpan).toStrictEqual({ end: expect.any(Function) })
    })

    it('accepts an optional startTime (number)', () => {
      const clock = { now: jest.fn(() => 1234), convert: jest.fn() }
      const client = createTestClient({ clock })
      const startTime = 1234
      const span = client.startSpan('test span', startTime)

      expect(span).toStrictEqual({ end: expect.any(Function) })
      expect(clock.now).not.toHaveBeenCalled()
      expect(clock.convert).not.toHaveBeenCalled()
    })

    it('accepts and converts an optional startTime (Date)', () => {
      const clock = { now: jest.fn(() => 1234), convert: jest.fn(() => 5678) }
      const client = createTestClient({ clock })
      const startTime = new Date()
      const span = client.startSpan('test span', startTime)

      expect(span).toStrictEqual({ end: expect.any(Function) })
      expect(clock.now).not.toHaveBeenCalled()
      expect(clock.convert).toHaveBeenCalled()
    })

    test.each([
      { type: 'string', startTime: 'i am not a startTime' },
      { type: 'bigint', startTime: BigInt(9007199254740991) },
      { type: 'boolean', startTime: true },
      { type: 'function', startTime: () => {} },
      { type: 'object', startTime: { property: 'test' } },
      { type: 'object', startTime: [] },
      { type: 'symbol', startTime: Symbol('test') }
    ])('uses default clock implementation if startTime is invalid ($type)', ({ startTime }) => {
      const processor = { add: jest.fn() }
      const clock = { now: jest.fn(() => 1234), convert: jest.fn() }
      const client = createTestClient({ processor, clock })
      client.start({ apiKey: 'test-api-key' })

      // @ts-expect-error startTime will be invalid
      const span = client.startSpan('test span', startTime)
      span.end()

      expect(clock.now).toHaveBeenCalled()
      expect(processor.add).toHaveBeenCalledWith(expect.objectContaining({ startTime: 1234 }))
    })
  })

  describe('Span.end()', () => {
    it('can be ended without an endTime', () => {
      const processor = { add: jest.fn() }
      const clock = { now: jest.fn(() => 1234), convert: jest.fn() }
      const idGenerator: IdGenerator = { generate: bits => `a random ${bits} bit string` }
      const client = createTestClient({ processor, idGenerator, clock })

      const span = client.startSpan('test span')
      span.end()

      expect(processor.add).toHaveBeenCalledWith({
        id: 'a random 64 bit string',
        traceId: 'a random 128 bit string',
        kind: 'client',
        name: 'test span',
        startTime: 1234,
        endTime: 1234
      })

      expect(processor.add).toHaveBeenCalledTimes(1)
    })

    it('accepts a Date object as endTime', () => {
      const processor = { add: jest.fn() }
      const clock = { now: jest.fn(() => 1234), convert: jest.fn(() => 5678) }
      const idGenerator: IdGenerator = { generate: bits => `a random ${bits} bit string` }
      const client = createTestClient({ processor, idGenerator, clock })

      const span = client.startSpan('test span')
      span.end(new Date('2023-01-02T03:04:05.006Z'))

      expect(processor.add).toHaveBeenCalledWith({
        id: 'a random 64 bit string',
        traceId: 'a random 128 bit string',
        kind: 'client',
        name: 'test span',
        startTime: 1234,
        endTime: 5678
      })

      expect(processor.add).toHaveBeenCalledTimes(1)
    })

    it('accepts a number of nanoseconds as endTime', () => {
      const processor = { add: jest.fn() }
      const clock = { now: jest.fn(() => 1234), convert: jest.fn(() => 5678) }
      const idGenerator: IdGenerator = { generate: bits => `a random ${bits} bit string` }
      const testClient = createTestClient({ processor, idGenerator, clock })

      const testSpan = testClient.startSpan('test span')
      testSpan.end(4321)

      expect(clock.convert).not.toHaveBeenCalled()

      expect(processor.add).toHaveBeenCalledWith({
        id: 'a random 64 bit string',
        traceId: 'a random 128 bit string',
        kind: 'client',
        name: 'test span',
        startTime: 1234,
        endTime: 4321
      })

      expect(processor.add).toHaveBeenCalledTimes(1)
    })
  })
})
