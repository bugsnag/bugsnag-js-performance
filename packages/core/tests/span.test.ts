import { SpanAttributes } from '../lib/attributes'
import Sampler from '../lib/sampler'
import { Kind, SpanInternal, spanToJson } from '../lib/span'
import {
  createTestClient,
  IncrementingClock,
  InMemoryDelivery,
  VALID_API_KEY
} from '@bugsnag/js-performance-test-utilities'

jest.useFakeTimers()

describe('SpanInternal', () => {
  test.each([
    { parameter: 'value', key: 'stringValue' },
    { parameter: true, key: 'boolValue' },
    { parameter: 0.5, key: 'doubleValue' },
    { parameter: 42, key: 'intValue', expected: '42' }
  ])('addAttribute results in an expected $key', ({ parameter, expected, key }) => {
    const clock = new IncrementingClock()
    const span = new SpanInternal('span-id', 'trace-id', 'span-name', 1234, new SpanAttributes(new Map()))
    const sampler = new Sampler(0.5)
    span.setAttribute('bugsnag.test.attribute', parameter)
    const json = spanToJson(span.end(5678, sampler.spanProbability), clock)
    expect(json).toStrictEqual(expect.objectContaining({
      attributes: [{
        key: 'bugsnag.test.attribute',
        value: {
          [key]: expected || parameter
        }
      }]
    }))
  })

  it('enables adding Events to spans', () => {
    const clock = new IncrementingClock('1970-01-01T00:00:00.000Z')
    const span = new SpanInternal('span-id', 'trace-id', 'span-name', 0, new SpanAttributes(new Map()))
    const sampler = new Sampler(0.5)
    span.addEvent('bugsnag.test.event', 1234)
    const json = spanToJson(span.end(5678, sampler.spanProbability), clock)
    expect(json).toStrictEqual(expect.objectContaining({
      events: [{
        name: 'bugsnag.test.event',
        timeUnixNano: '1234000000'
      }]
    }))
  })
})

describe('Span', () => {
  describe('client.startSpan()', () => {
    it('returns a Span', () => {
      const client = createTestClient()
      const span = client.startSpan('test span')
      expect(span).toStrictEqual({ end: expect.any(Function) })
    })

    it.each([
      { type: 'string', startTime: 'i am not a startTime' },
      { type: 'bigint', startTime: BigInt(9007199254740991) },
      { type: 'boolean', startTime: true },
      { type: 'function', startTime: () => {} },
      { type: 'object', startTime: { property: 'test' } },
      { type: 'object', startTime: [] },
      { type: 'symbol', startTime: Symbol('test') }
    ])('uses default clock implementation if startTime is invalid ($type)', ({ startTime }) => {
      const delivery = new InMemoryDelivery()
      const clock = new IncrementingClock('1970-01-01T00:00:00Z')
      const client = createTestClient({ deliveryFactory: () => delivery, clock })
      client.start({ apiKey: VALID_API_KEY })

      // @ts-expect-error startTime will be invalid
      const span = client.startSpan('test span', startTime)
      span.end()

      jest.runAllTimers()

      expect(delivery).toHaveSentSpan(expect.objectContaining({
        startTimeUnixNano: '1000000'
      }))
    })
  })

  describe('Span.end()', () => {
    it('can be ended without an endTime', () => {
      const delivery = new InMemoryDelivery()
      const clock = new IncrementingClock('1970-01-01T00:00:00Z')
      const client = createTestClient({ deliveryFactory: () => delivery, clock })
      client.start({ apiKey: VALID_API_KEY })

      const span = client.startSpan('test span')
      span.end()

      jest.runAllTimers()

      expect(delivery).toHaveSentSpan({
        spanId: 'a random 64 bit string',
        traceId: 'a random 128 bit string',
        kind: Kind.Client,
        name: 'test span',
        startTimeUnixNano: '1000000',
        endTimeUnixNano: '2000000',
        attributes: expect.any(Object),
        events: expect.any(Array)
      })
    })

    it('accepts a Date object as endTime', () => {
      const clock = new IncrementingClock('2023-01-02T03:04:05.006Z')
      const delivery = new InMemoryDelivery()
      const client = createTestClient({ deliveryFactory: () => delivery, clock })
      client.start({ apiKey: VALID_API_KEY })

      const span = client.startSpan('test span')
      span.end(new Date('2023-01-02T03:04:05.008Z')) // 2ms after time origin

      jest.runAllTimers()

      expect(delivery).toHaveSentSpan({
        spanId: 'a random 64 bit string',
        traceId: 'a random 128 bit string',
        attributes: expect.any(Object),
        events: expect.any(Array),
        kind: Kind.Client,
        name: 'test span',
        startTimeUnixNano: '1672628645007000000',
        endTimeUnixNano: '1672628645008000000'
      })
    })

    it('accepts a number of nanoseconds as endTime', () => {
      const clock = new IncrementingClock('1970-01-01T00:00:00.000Z')
      const delivery = new InMemoryDelivery()

      const client = createTestClient({ deliveryFactory: () => delivery, clock })
      client.start({ apiKey: VALID_API_KEY })

      const span = client.startSpan('test span')
      span.end(4321)

      jest.runAllTimers()

      expect(delivery).toHaveSentSpan({
        spanId: 'a random 64 bit string',
        traceId: 'a random 128 bit string',
        attributes: expect.any(Object),
        events: expect.any(Array),
        kind: Kind.Client,
        name: 'test span',
        startTimeUnixNano: '1000000',
        endTimeUnixNano: '4321000000'
      })
    })

    it('will always be sampled when probability is 1', () => {
      const delivery = new InMemoryDelivery()

      const client = createTestClient({ deliveryFactory: () => delivery })
      client.start({
        apiKey: VALID_API_KEY,
        samplingProbability: 1
      })

      const span = client.startSpan('test span')
      span.end()

      jest.runAllTimers()

      expect(delivery.requests).toHaveLength(1)
    })

    it('will always be discarded when probability is 0', () => {
      const delivery = new InMemoryDelivery()

      const client = createTestClient({ deliveryFactory: () => delivery })
      client.start({
        apiKey: VALID_API_KEY,
        samplingProbability: 0
      })

      const span = client.startSpan('test span')
      span.end()

      jest.runAllTimers()

      expect(delivery.requests).toHaveLength(0)
    })

    it('will sample spans based on their traceId', () => {
      const delivery = new InMemoryDelivery()

      // trace IDs with known sampling rates; this allows us to check that the
      // first span is sampled and the second is discarded with a specific
      // sampling probability
      const traceIds = [
        '0123456789abcdeffedcba9876543210', // samplingRate: 0
        'a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3', // samplingRate: 0.14902140296740024
        '7eb23db1d1456caa839b662f3729d23c' // samplingRate: 0.10653525779641589
      ]

      const idGenerator = {
        generate (bits: 64 | 128) {
          if (bits === 128) {
            const id = traceIds.shift()

            if (id) {
              return id
            }

            throw new Error('Too many trace IDs were generated!')
          }

          return 'a span ID'
        }
      }

      const client = createTestClient({
        deliveryFactory: () => delivery,
        idGenerator
      })

      client.start({
        apiKey: VALID_API_KEY,
        // 0.14 as the second span's trace ID results in a sampling rate greater
        // than this but the other two are smaller
        samplingProbability: 0.14
      })

      client.startSpan('span 1').end()
      client.startSpan('span 2').end()
      client.startSpan('span 3').end()

      jest.runAllTimers()

      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: 'span 1'
      }))

      expect(delivery).not.toHaveSentSpan(expect.objectContaining({
        name: 'span 2'
      }))

      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: 'span 3'
      }))
    })
  })
})
