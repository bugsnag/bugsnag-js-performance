import { DefaultSpanContextStorage } from '@bugsnag/core-performance'
import {
  ControllableBackgroundingListener,
  IncrementingClock,
  StableIdGenerator,
  spanAttributesSource
} from '@bugsnag/js-performance-test-utilities'
import {
  SpanFactory,
  spanToJson,
  type SpanEnded
} from '../lib'
import Sampler from '../lib/sampler'

const jestLogger = { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() }

describe('SpanFactory', () => {
  describe('startSpan', () => {
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

      // @ts-expect-error 'attributes' is private but very awkward to test otherwise
      expect(span.attributes.attributes.get('bugsnag.span.first_class')).toBe(false)
    })

    it.each([
      null,
      undefined,
      1,
      0,
      'true',
      'false',
      [true, false]
    ])('omits first class attribute when isFirstClass is %s', (isFirstClass) => {
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

      // @ts-expect-error 'attributes' is private but very awkward to test otherwise
      expect(span.attributes.attributes.has('bugsnag.span.first_class')).toBe(false)
    })
  })
})
