import { DefaultSpanContextStorage } from '@bugsnag/core-performance'
import {
  ControllableBackgroundingListener,
  InMemoryDelivery,
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

        const childSpan = client.startSpan('child span', { parentContext: undefined })
        childSpan.end()

        await jest.runOnlyPendingTimersAsync()

        // child span should be a child of the root span
        expect(delivery).toHaveSentSpan(expect.objectContaining({
          name: 'child span',
          parentSpanId: rootSpan.id,
          traceId: rootSpan.traceId
        }))

        expect(jestLogger.warn).not.toHaveBeenCalled()
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

        const span = spanFactory.startSpan('name', {})

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

      it('omits first class attribute when isFirstClass is undefined', () => {
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

        const span = spanFactory.startSpan('name', {})
        expect(jestLogger.warn).not.toHaveBeenCalled()

        // @ts-expect-error 'attributes' is private but very awkward to test otherwise
        expect(span.attributes.attributes.has('bugsnag.span.first_class')).toBe(false)
      })
    })
  })
})
