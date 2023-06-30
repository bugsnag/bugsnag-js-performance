import { DefaultSpanContextStorage } from '@bugsnag/core-performance'
import {
  ControllableBackgroundingListener,
  InMemoryDelivery,
  InMemoryProcessor,
  IncrementingClock,
  IncrementingIdGenerator,
  StableIdGenerator,
  VALID_API_KEY,
  createTestClient,
  spanAttributesSource
} from '@bugsnag/js-performance-test-utilities'
import {
  SpanFactory,
  spanToJson,
  type SpanEnded,
  spanContextEquals
} from '../lib'
import Sampler from '../lib/sampler'

jest.useFakeTimers()

const jestLogger = { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() }

beforeEach(() => {
  jest.clearAllMocks()
})

describe('SpanFactory', () => {
  describe('startSpan', () => {
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
        const spanFactory = new SpanFactory(
          new InMemoryProcessor(),
          new Sampler(1.0),
          new StableIdGenerator(),
          spanAttributesSource,
          new IncrementingClock(),
          new ControllableBackgroundingListener(),
          jestLogger,
          new DefaultSpanContextStorage(new ControllableBackgroundingListener())
        )

        const span = spanFactory.startSpan(name)
        expect(span.name).toEqual(String(name))
        expect(jestLogger.warn).toHaveBeenCalledWith(`Invalid span options \n - name should be a string, got ${typeof name}`)
      })
    })

    describe('options', () => {
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
          span.end()

          await jest.runOnlyPendingTimersAsync()

          expect(delivery).toHaveSentSpan(expect.objectContaining({
            startTimeUnixNano: '1000000'
          }))

          expect(jestLogger.warn).toHaveBeenCalledWith(`Invalid span options \n - startTime should be a number or Date, got ${typeof options.startTime}`)
        })
      })
      describe('parentContext', () => {
        it('sets traceId and parentSpanId from parentContext if specified', async () => {
          const delivery = new InMemoryDelivery()
          const client = createTestClient({ idGenerator: new IncrementingIdGenerator(), deliveryFactory: () => delivery })
          client.start({ apiKey: VALID_API_KEY, logger: jestLogger })
          await jest.runOnlyPendingTimersAsync()

          // push two spans onto the context stack
          const span1 = client.startSpan('should become parent')
          const span2 = client.startSpan('should not become parent')
          expect(spanContextEquals(span2, client.currentSpanContext)).toBe(true)

          // start a new child span with an invalid parent context
          const childOfSpan1 = client.startSpan('child of span 1', { parentContext: span1 })
          childOfSpan1.end()

          await jest.runOnlyPendingTimersAsync()

          // child span should be nested under the first span
          expect(delivery).toHaveSentSpan(expect.objectContaining({
            name: 'child of span 1',
            parentSpanId: span1.id,
            traceId: span1.traceId
          }))

          expect(jestLogger.warn).not.toHaveBeenCalled()
        })

        it('starts a new root span when parentContext is null', async () => {
          const idGenerator = new IncrementingIdGenerator()
          const delivery = new InMemoryDelivery()
          const client = createTestClient({ idGenerator, deliveryFactory: () => delivery })
          client.start({ apiKey: VALID_API_KEY, logger: jestLogger })
          await jest.runOnlyPendingTimersAsync()

          const rootSpan = client.startSpan('root span')
          expect(spanContextEquals(rootSpan, client.currentSpanContext)).toBe(true)

          const newRootSpan = client.startSpan('new root span', { parentContext: null })
          newRootSpan.end()

          await jest.runOnlyPendingTimersAsync()

          // new root span should have a new trace ID and no parentSpanId
          expect(delivery).toHaveSentSpan(expect.objectContaining({
            name: 'new root span',
            parentSpanId: undefined,
            traceId: `trace ID ${idGenerator.traceCount}`
          }))

          expect(jestLogger.warn).not.toHaveBeenCalled()
        })

        it('becomes a child of the current context when parentContext is undefined', async () => {
          const delivery = new InMemoryDelivery()
          const client = createTestClient({ idGenerator: new IncrementingIdGenerator(), deliveryFactory: () => delivery })
          client.start({ apiKey: VALID_API_KEY, logger: jestLogger })
          await jest.runOnlyPendingTimersAsync()

          const rootSpan = client.startSpan('root span')
          expect(spanContextEquals(rootSpan, client.currentSpanContext)).toBe(true)

          const childSpan = client.startSpan('new root span', { parentContext: undefined })
          childSpan.end()

          await jest.runOnlyPendingTimersAsync()

          // new root span should have a new trace ID and no parentSpanId
          expect(delivery).toHaveSentSpan(expect.objectContaining({
            name: 'new root span',
            parentSpanId: rootSpan.id,
            traceId: rootSpan.traceId
          }))

          expect(jestLogger.warn).not.toHaveBeenCalled()
        })

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

        it.each(parentContextOptions)('becomes a child of the current context and logs when parentContext is invalid ($type)', async (options) => {
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
          expect(jestLogger.warn).toHaveBeenCalledWith(`Invalid span options \n - parentContext should be a SpanContext, got ${typeof options.parentContext}`)

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
        it('does not become the current SpanContext when SpanOptions.makeCurrentContext is false', async () => {
          const client = createTestClient({ idGenerator: new IncrementingIdGenerator() })
          client.start({ apiKey: VALID_API_KEY, logger: jestLogger })
          await jest.runOnlyPendingTimersAsync()

          expect(client.currentSpanContext).toBeUndefined()

          const spanIsContext = client.startSpan('context span')
          expect(spanContextEquals(spanIsContext, client.currentSpanContext)).toBe(true)

          const spanIsNotContext = client.startSpan('non context span', { makeCurrentContext: false })
          expect(spanContextEquals(spanIsNotContext, client.currentSpanContext)).toBe(false)
          expect(spanContextEquals(spanIsContext, client.currentSpanContext)).toBe(true)

          expect(jestLogger.warn).not.toHaveBeenCalled()
        })

        it('becomes the current SpanContext when makeCurrentContext is true or undefined', async () => {
          const client = createTestClient({ idGenerator: new IncrementingIdGenerator() })
          client.start({ apiKey: VALID_API_KEY, logger: jestLogger })
          await jest.runOnlyPendingTimersAsync()

          expect(client.currentSpanContext).toBeUndefined()

          const optionIsTrue = client.startSpan('context span', { makeCurrentContext: true })
          expect(spanContextEquals(optionIsTrue, client.currentSpanContext)).toBe(true)

          const optionIsUndefined = client.startSpan('context span', { makeCurrentContext: undefined })
          expect(spanContextEquals(optionIsUndefined, client.currentSpanContext)).toBe(true)

          expect(jestLogger.warn).not.toHaveBeenCalled()
        })

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
          expect(spanContextEquals(spanIsContext, client.currentSpanContext)).toBe(true)

          expect(jestLogger.warn).toHaveBeenCalledWith(`Invalid span options \n - makeCurrentContext should be true|false, got ${typeof options.makeCurrentContext}`)
        })
      })
      describe('isFirstClass', () => {
        it('omits first class span attribute by default', () => {
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

          const span = spanFactory.startSpan('name')

          // @ts-expect-error 'attributes' is private but very awkward to test otherwise
          expect(span.attributes.attributes.has('bugsnag.span.first_class')).toBe(false)
        })

        it('creates first class spans when isFirstClass is true', () => {
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

          const span = spanFactory.startSpan('name', { isFirstClass: true })
          expect(jestLogger.warn).not.toHaveBeenCalled()

          // @ts-expect-error 'attributes' is private but very awkward to test otherwise
          expect(span.attributes.attributes.get('bugsnag.span.first_class')).toBe(true)
        })

        it('does not create first class spans when isFirstClass is false', () => {
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

          const span = spanFactory.startSpan('name', { isFirstClass: false })
          expect(jestLogger.warn).not.toHaveBeenCalled()

          // @ts-expect-error 'attributes' is private but very awkward to test otherwise
          expect(span.attributes.attributes.get('bugsnag.span.first_class')).toBe(false)
        })

        it.each([
          null,
          1,
          0,
          'true',
          'false',
          [true, false]
        ])('omits first class attribute and logs when isFirstClass is invalid (%s)', (isFirstClass) => {
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

          // @ts-expect-error 'isFirstClass' is the wrong type
          const span = spanFactory.startSpan('name', { isFirstClass })

          expect(jestLogger.warn).toHaveBeenCalledWith(`Invalid span options \n - isFirstClass should be true|false, got ${typeof isFirstClass}`)

          // @ts-expect-error 'attributes' is private but very awkward to test otherwise
          expect(span.attributes.attributes.has('bugsnag.span.first_class')).toBe(false)
        })
      })

      it('handles null span options', () => {
        const spanFactory = new SpanFactory(
          new InMemoryProcessor(),
          new Sampler(1.0),
          new StableIdGenerator(),
          spanAttributesSource,
          new IncrementingClock(),
          new ControllableBackgroundingListener(),
          jestLogger,
          new DefaultSpanContextStorage(new ControllableBackgroundingListener())
        )

        // @ts-expect-error null options
        const span = spanFactory.startSpan('name', null)
        expect(span.name).toBe('name')
      })
    })
  })
})
