import { DefaultSpanContextStorage, Kind } from '@bugsnag/core-performance'
import {
  ControllableBackgroundingListener,
  InMemoryDelivery,
  IncrementingClock,
  IncrementingIdGenerator,
  StableIdGenerator,
  VALID_API_KEY,
  createSamplingProbability,
  createTestClient,
  spanAttributesSource
} from '@bugsnag/js-performance-test-utilities'
import {
  InMemoryPersistence,
  SpanAttributes,
  SpanFactory,
  SpanInternal,
  spanToJson,
  spanContextEquals,
  type SpanAttribute,
  type SpanEnded
} from '../lib'
import Sampler from '../lib/sampler'

jest.useFakeTimers()

const jestLogger = {
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('SpanInternal', () => {
  describe('.setAttribute()', () => {
    test.each([
      { parameter: 'value', key: 'stringValue' },
      { parameter: true, key: 'boolValue' },
      { parameter: 0.5, key: 'doubleValue' },
      { parameter: 42, key: 'intValue', expected: '42' }
    ])('setAttribute results in an expected $key', ({ parameter, expected, key }) => {
      const clock = new IncrementingClock()
      const sampler = new Sampler(0.5)
      const delivery = { send: jest.fn() }
      const processor = { add: (span: SpanEnded) => delivery.send(spanToJson(span, clock)) }
      const backgroundingListener = new ControllableBackgroundingListener()
      const spanFactory = new SpanFactory(
        processor,
        sampler,
        new StableIdGenerator(),
        spanAttributesSource,
        new IncrementingClock(),
        backgroundingListener,
        jestLogger,
        new DefaultSpanContextStorage(backgroundingListener)
      )

      const spanInternal = spanFactory.startSpan('span-name', { startTime: 1234 })
      spanInternal.setAttribute('bugsnag.test.attribute', parameter)

      spanFactory.endSpan(spanInternal, 5678)

      expect(delivery.send).toHaveBeenCalledWith(expect.objectContaining({
        attributes: expect.arrayContaining([{
          key: 'bugsnag.test.attribute',
          value: {
            [key]: expected || parameter
          }
        }])
      }))
    })
  })

  describe('.addEvent()', () => {
    it('enables adding Events to spans', () => {
      const clock = new IncrementingClock('1970-01-01T00:00:00.000Z')
      const sampler = new Sampler(0.5)
      const delivery = { send: jest.fn() }
      const processor = { add: (span: SpanEnded) => delivery.send(spanToJson(span, clock)) }
      const backgroundingListener = new ControllableBackgroundingListener()
      const spanFactory = new SpanFactory(
        processor,
        sampler,
        new StableIdGenerator(),
        spanAttributesSource,
        new IncrementingClock(),
        backgroundingListener,
        jestLogger,
        new DefaultSpanContextStorage(backgroundingListener)
      )

      const spanInternal = spanFactory.startSpan('span-name', { startTime: 1234 })
      spanInternal.addEvent('bugsnag.test.event', 1234)

      spanFactory.endSpan(spanInternal, 5678)

      expect(delivery.send).toHaveBeenCalledWith(expect.objectContaining({
        events: [{
          name: 'bugsnag.test.event',
          timeUnixNano: '1234000000'
        }]
      }))
    })
  })

  describe('bugsnag.sampling.p', () => {
    it.each([0.25, 0.5, 0.1, 1, 0, 0.4, 0.3])('is set to the correct value on "end"', (probability) => {
      const span = new SpanInternal(
        'span id',
        'trace id',
        'name',
        1234,
        new SpanAttributes(new Map<string, SpanAttribute>())
      )

      const endedSpan = span.end(5678, createSamplingProbability(probability))

      // @ts-expect-error 'attributes' is private but very awkward to test otherwise
      expect(endedSpan.attributes.attributes.get('bugsnag.sampling.p')).toBe(probability)
    })

    it.each([0.25, 0.5, 0.1, 1, 0, 0.4, 0.3])('is updated when samplingProbability is changed', (probability) => {
      const span = new SpanInternal(
        'span id',
        'trace id',
        'name',
        1234,
        new SpanAttributes(new Map<string, SpanAttribute>())
      )

      const endedSpan = span.end(5678, createSamplingProbability(probability))
      endedSpan.samplingProbability = createSamplingProbability(probability + 0.1)

      // @ts-expect-error 'attributes' is private but very awkward to test otherwise
      expect(endedSpan.attributes.attributes.get('bugsnag.sampling.p')).toBe(probability + 0.1)
    })
  })
})

describe('Span', () => {
  describe('client.startSpan()', () => {
    it('returns a Span', () => {
      const client = createTestClient()
      const span = client.startSpan('test span')
      expect(span).toStrictEqual({
        id: expect.any(String),
        traceId: expect.any(String),
        end: expect.any(Function),
        isValid: expect.any(Function)
      })
    })

    describe('name', () => {
      const invalidSpanNames: any[] = [
        { type: 'bigint', name: BigInt(9007199254740991) },
        { type: 'true', name: true },
        { type: 'false', name: false },
        { type: 'function', name: () => {} },
        { type: 'object', name: { property: 'test' } },
        { type: 'empty array', name: [] },
        { type: 'array', name: [1, 2, 3] },
        { type: 'symbol', name: Symbol('test') },
        { type: 'null', name: null }
      ]

      it.each(invalidSpanNames)('stringifies and logs when span name is invalid ($type)', async ({ name }) => {
        const delivery = new InMemoryDelivery()
        const client = createTestClient({ deliveryFactory: () => delivery })
        client.start({ apiKey: VALID_API_KEY, logger: jestLogger })
        await jest.runOnlyPendingTimersAsync()

        const span = client.startSpan(name, {})
        expect(jestLogger.warn).toHaveBeenCalledWith(`Invalid span options\n  - name should be a string, got ${typeof name}`)

        span.end()
        await jest.runOnlyPendingTimersAsync()

        expect(delivery).toHaveSentSpan(expect.objectContaining({
          name: String(name)
        }))
      })
    })

    describe('options', () => {
      const invalidSpanOptions: any[] = [
        { type: 'string', options: 'invalid' },
        { type: 'bigint', options: BigInt(9007199254740991) },
        { type: 'true', options: true },
        { type: 'false', options: false },
        { type: 'function', options: () => {} },
        { type: 'empty array', options: [] },
        { type: 'array', options: [1, 2, 3] },
        { type: 'symbol', options: Symbol('test') },
        { type: 'null', options: null }
      ]

      it.each(invalidSpanOptions)('uses the default values and logs when options is invalid ($type)', async ({ options }) => {
        const delivery = new InMemoryDelivery()
        const clock = new IncrementingClock('1970-01-01T00:00:00Z')
        const client = createTestClient({ deliveryFactory: () => delivery, clock })

        client.start({ apiKey: VALID_API_KEY, logger: jestLogger })
        await jest.runOnlyPendingTimersAsync()

        // add a root span to the context
        const rootSpan = client.startSpan('root-span')
        expect(spanContextEquals(rootSpan, client.currentSpanContext)).toBe(true)

        // start a span with invalid options
        const span = client.startSpan('test-span', options)
        expect(jestLogger.warn).toHaveBeenCalledWith('Invalid span options\n  - options is not an object')

        // span should become the current context by default
        expect(spanContextEquals(span, client.currentSpanContext)).toBe(true)

        span.end()
        await jest.runOnlyPendingTimersAsync()

        expect(delivery.requests.length).toBe(1)
        const delivered = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]

        // span should become a child of the current context by default
        expect(delivered.parentSpanId).toEqual(rootSpan.id)
        expect(delivered.traceId).toEqual(rootSpan.traceId)

        // span should not have a first class attribute by default
        expect(delivered).not.toHaveAttribute('bugnsag.span.first_class')
      })

      describe('startTime', () => {
        const invalidStartTimes: any[] = [
          { type: 'string', startTime: 'i am not a startTime' },
          { type: 'bigint', startTime: BigInt(9007199254740991) },
          { type: 'true', startTime: true },
          { type: 'false', startTime: false },
          { type: 'function', startTime: () => {} },
          { type: 'object', startTime: { property: 'test' } },
          { type: 'empty array', startTime: [] },
          { type: 'array', startTime: [1, 2, 3] },
          { type: 'symbol', startTime: Symbol('test') },
          { type: 'null', startTime: null }
        ]

        invalidStartTimes.push(...invalidStartTimes.map(
          ({ type, startTime }) => ({
            type: `{ startTime: ${type} }`,
            startTime: { startTime }
          }))
        )

        it.each(invalidStartTimes)('uses default clock implementation and logs if startTime is invalid ($type)', async (options) => {
          const delivery = new InMemoryDelivery()
          const clock = new IncrementingClock('1970-01-01T00:00:00Z')
          const client = createTestClient({ deliveryFactory: () => delivery, clock })

          client.start({ apiKey: VALID_API_KEY, logger: jestLogger })

          await jest.runOnlyPendingTimersAsync()

          const span = client.startSpan('test span', options)
          expect(jestLogger.warn).toHaveBeenCalledWith(`Invalid span options\n  - startTime should be a number or Date, got ${typeof options.startTime}`)

          span.end()
          await jest.runOnlyPendingTimersAsync()

          expect(delivery).toHaveSentSpan(expect.objectContaining({
            startTimeUnixNano: '1000000'
          }))
        })
      })
      describe('parentContext', () => {
        const parentContextOptions: any[] = [
          { type: 'true', parentContext: true },
          { type: 'string', parentContext: 'yes please' },
          { type: 'bigint', parentContext: BigInt(9007199254740991) },
          { type: 'function', parentContext: () => {} },
          { type: 'object', parentContext: { property: 'test' } },
          { type: 'empty array', parentContext: [] },
          { type: 'array', parentContext: [1, 2, 3] },
          { type: 'symbol', parentContext: Symbol('test') }
        ]

        it.each(parentContextOptions)('defaults to undefined and logs when parentContext is invalid ($type)', async (options) => {
          const delivery = new InMemoryDelivery()
          const client = createTestClient({ idGenerator: new IncrementingIdGenerator(), deliveryFactory: () => delivery })
          client.start({ apiKey: VALID_API_KEY, logger: jestLogger })
          await jest.runOnlyPendingTimersAsync()

          // push two spans onto the context stack
          client.startSpan('root span')
          const parentSpan = client.startSpan('parent span')
          expect(spanContextEquals(parentSpan, client.currentSpanContext)).toBe(true)

          // start a new child span with an invalid parent context
          const childSpan = client.startSpan('child span', options)
          expect(jestLogger.warn).toHaveBeenCalledWith(`Invalid span options\n  - parentContext should be a SpanContext, got ${typeof options.parentContext}`)

          childSpan.end()
          await jest.runOnlyPendingTimersAsync()

          // child span should be nested under the parent span
          expect(delivery).toHaveSentSpan(expect.objectContaining({
            name: 'child span',
            parentSpanId: parentSpan.id,
            traceId: parentSpan.traceId
          }))
        })
      })
      describe('makeCurrentContext', () => {
        const makeCurrentContextOptions: any[] = [
          { type: 'string', makeCurrentContext: 'yes please' },
          { type: 'bigint', makeCurrentContext: BigInt(9007199254740991) },
          { type: 'function', makeCurrentContext: () => {} },
          { type: 'object', makeCurrentContext: { property: 'test' } },
          { type: 'empty array', makeCurrentContext: [] },
          { type: 'array', makeCurrentContext: [1, 2, 3] },
          { type: 'symbol', makeCurrentContext: Symbol('test') },
          { type: 'null', makeCurrentContext: null }
        ]

        it.each(makeCurrentContextOptions)('becomes the current SpanContext and logs when makeCurrentContext is invalid ($type)', async (options) => {
          const client = createTestClient()
          client.start({ apiKey: VALID_API_KEY, logger: jestLogger })
          await jest.runOnlyPendingTimersAsync()

          expect(client.currentSpanContext).toBeUndefined()

          const spanIsContext = client.startSpan('context span', options)

          expect(jestLogger.warn).toHaveBeenCalledWith(`Invalid span options\n  - makeCurrentContext should be true|false, got ${typeof options.makeCurrentContext}`)
          expect(spanContextEquals(spanIsContext, client.currentSpanContext)).toBe(true)
        })
      })

      describe('isFirstClass', () => {
        it.each([
          null,
          1,
          0,
          'true',
          'false',
          [true, false]
        ])('omits first class attribute and logs when isFirstClass is invalid (%s)', async (isFirstClass) => {
          const delivery = new InMemoryDelivery()
          const client = createTestClient({ deliveryFactory: () => delivery })
          client.start({ apiKey: VALID_API_KEY, logger: jestLogger })
          await jest.runOnlyPendingTimersAsync()

          // @ts-expect-error 'isFirstClass' is the wrong type
          const span = client.startSpan('name', { isFirstClass })
          expect(jestLogger.warn).toHaveBeenCalledWith(`Invalid span options\n  - isFirstClass should be true|false, got ${typeof isFirstClass}`)

          span.end()
          await jest.runOnlyPendingTimersAsync()

          expect(delivery.requests.length).toBe(1)

          const delivered = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]
          expect(delivered).not.toHaveAttribute('bugnsag.span.first_class')
        })
      })
    })
  })

  describe('Span.end()', () => {
    it('can be ended without an endTime', async () => {
      const delivery = new InMemoryDelivery()
      const clock = new IncrementingClock('1970-01-01T00:00:00Z')
      const client = createTestClient({ deliveryFactory: () => delivery, clock })
      client.start({ apiKey: VALID_API_KEY })

      const span = client.startSpan('test span')
      span.end()

      await jest.runOnlyPendingTimersAsync()

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

    it('accepts a Date object as endTime', async () => {
      const clock = new IncrementingClock('2023-01-02T03:04:05.006Z')
      const delivery = new InMemoryDelivery()
      const client = createTestClient({ deliveryFactory: () => delivery, clock })
      client.start({ apiKey: VALID_API_KEY })

      const span = client.startSpan('test span')
      span.end(new Date('2023-01-02T03:04:05.008Z')) // 2ms after time origin

      await jest.runOnlyPendingTimersAsync()

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

    it('accepts a number of nanoseconds as endTime', async () => {
      const clock = new IncrementingClock('1970-01-01T00:00:00.000Z')
      const delivery = new InMemoryDelivery()

      const client = createTestClient({ deliveryFactory: () => delivery, clock })
      client.start({ apiKey: VALID_API_KEY })

      const span = client.startSpan('test span')
      span.end(4321)

      await jest.runOnlyPendingTimersAsync()

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

    it('will always be sampled when probability is 1', async () => {
      const delivery = new InMemoryDelivery()
      const persistence = new InMemoryPersistence()

      const client = createTestClient({ deliveryFactory: () => delivery, persistence })
      client.start(VALID_API_KEY)

      await jest.runOnlyPendingTimersAsync()

      const span = client.startSpan('test span')
      span.end()

      await jest.runOnlyPendingTimersAsync()

      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: 'test span',
        attributes: expect.arrayContaining([
          { key: 'bugsnag.sampling.p', value: { doubleValue: 1 } }
        ])
      }))
    })

    it('will always be discarded when probability is 0', async () => {
      const delivery = new InMemoryDelivery()
      delivery.setNextSamplingProbability(0.0)

      const persistence = new InMemoryPersistence()
      await persistence.save('bugsnag-sampling-probability', { value: 0.0, time: Date.now() })

      const client = createTestClient({ deliveryFactory: () => delivery, persistence })
      client.start(VALID_API_KEY)

      await jest.runOnlyPendingTimersAsync()

      const span = client.startSpan('test span')
      span.end()

      await jest.runOnlyPendingTimersAsync()

      expect(delivery.requests).toHaveLength(0)
    })

    it('will sample spans based on their traceId', async () => {
      // 0.14 as the second span's trace ID results in a sampling rate greater
      // than this but the other two are smaller
      const samplingProbability = 0.14

      const delivery = new InMemoryDelivery()
      delivery.setNextSamplingProbability(samplingProbability)

      const persistence = new InMemoryPersistence()
      await persistence.save('bugsnag-sampling-probability', { value: samplingProbability, time: Date.now() })

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
        idGenerator,
        persistence
      })

      client.start(VALID_API_KEY)

      await jest.runOnlyPendingTimersAsync()

      client.startSpan('span 1').end()
      client.startSpan('span 2').end()
      client.startSpan('span 3').end()

      await jest.runOnlyPendingTimersAsync()

      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: 'span 1',
        attributes: expect.arrayContaining([
          { key: 'bugsnag.sampling.p', value: { doubleValue: 0.14 } }
        ])
      }))

      expect(delivery).not.toHaveSentSpan(expect.objectContaining({
        name: 'span 2'
      }))

      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: 'span 3',
        attributes: expect.arrayContaining([
          { key: 'bugsnag.sampling.p', value: { doubleValue: 0.14 } }
        ])
      }))
    })

    it('will cancel any open spans if the app is backgrounded', async () => {
      const delivery = new InMemoryDelivery()
      const backgroundingListener = new ControllableBackgroundingListener()
      const logger = { warn: jest.fn(), debug: jest.fn(), error: jest.fn(), info: jest.fn() }
      const client = createTestClient({
        deliveryFactory: () => delivery,
        backgroundingListener
      })

      client.start({
        apiKey: VALID_API_KEY,
        logger
      })

      await jest.runOnlyPendingTimersAsync()

      // started in foreground and ended in background
      const movedToBackground = client.startSpan('moved-to-background')
      backgroundingListener.sendToBackground()
      movedToBackground.end()

      expect(logger.warn).not.toHaveBeenCalled()

      // started in background and ended in foreground
      const movedToForeground = client.startSpan('moved-to-foreground')
      backgroundingListener.sendToForeground()
      movedToForeground.end()

      expect(logger.warn).not.toHaveBeenCalled()

      // entirely in background
      backgroundingListener.sendToBackground()
      const backgroundSpan = client.startSpan('entirely-in-background')
      backgroundSpan.end()

      expect(logger.warn).not.toHaveBeenCalled()

      // started and ended in foreground but backgrounded during span
      backgroundingListener.sendToForeground()
      const backgroundedDuringSpan = client.startSpan('backgrounded-during-span')
      backgroundingListener.sendToBackground()
      backgroundingListener.sendToForeground()
      backgroundedDuringSpan.end()

      expect(logger.warn).not.toHaveBeenCalled()

      // entirely in foreground (should be delivered)
      const inForeground = client.startSpan('entirely-in-foreground')
      inForeground.end()

      await jest.runOnlyPendingTimersAsync()

      expect(logger.warn).not.toHaveBeenCalled()

      expect(delivery).not.toHaveSentSpan(expect.objectContaining({
        name: 'moved-to-background'
      }))

      expect(delivery).not.toHaveSentSpan(expect.objectContaining({
        name: 'moved-to-foreground'
      }))

      expect(delivery).not.toHaveSentSpan(expect.objectContaining({
        name: 'entirely-in-background'
      }))

      expect(delivery).not.toHaveSentSpan(expect.objectContaining({
        name: 'backgrounded-during-span'
      }))

      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: 'entirely-in-foreground'
      }))
    })

    it('will not end a span that has already been ended', async () => {
      const delivery = new InMemoryDelivery()
      const backgroundingListener = new ControllableBackgroundingListener()
      const logger = { warn: jest.fn(), debug: jest.fn(), error: jest.fn(), info: jest.fn() }
      const client = createTestClient({
        deliveryFactory: () => delivery,
        backgroundingListener
      })

      client.start({
        apiKey: VALID_API_KEY,
        logger
      })

      const span = client.startSpan('span-ended-once')
      span.end()

      await jest.runOnlyPendingTimersAsync()

      expect(logger.warn).not.toHaveBeenCalled()
      expect(delivery.requests).toHaveLength(1)
      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: 'span-ended-once'
      }))

      span.end()

      await jest.runOnlyPendingTimersAsync()

      expect(logger.warn).toHaveBeenCalledWith('Attempted to end a Span which has already ended.')
      expect(delivery.requests).toHaveLength(1)
    })

    it('will remove the span from the context stack (if it is the current context)', () => {
      const idGenerator = {
        count: 0,
        generate (bits: 64 | 128) {
          if (bits === 64) {
            this.count++
            return `span ID ${this.count}`
          }

          return 'a trace ID'
        }
      }

      const client = createTestClient({ idGenerator })
      client.start({ apiKey: VALID_API_KEY })
      expect(client.currentSpanContext).toBeUndefined()

      const span1 = client.startSpan('span 1')
      const span2 = client.startSpan('span 2')
      const span3 = client.startSpan('span 3')
      expect(spanContextEquals(span3, client.currentSpanContext)).toBe(true)

      // span2 is not at the top of the context stack so span3 should still be the current context
      span2.end()
      expect(spanContextEquals(span3, client.currentSpanContext)).toBe(true)

      // span3 is at the top of the stack so should be popped when ended
      // span2 is already closed so span1 should now be the current context
      span3.end()
      expect(spanContextEquals(span1, client.currentSpanContext)).toBe(true)

      span1.end()
      expect(client.currentSpanContext).toBeUndefined()
    })
  })
})
