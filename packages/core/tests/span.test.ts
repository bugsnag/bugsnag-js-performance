
import { DefaultSpanContextStorage, Kind } from '@bugsnag/core-performance'
import {
  ControllableBackgroundingListener,
  InMemoryDelivery,
  IncrementingClock,
  StableIdGenerator,
  VALID_API_KEY,
  createTestClient,
  spanAttributesSource
} from '@bugsnag/js-performance-test-utilities'
import {
  InMemoryPersistence,
  SpanFactory,
  spanToJson,
  spanContextEquals,
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

      expect(delivery.requests).toHaveLength(1)
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
        name: 'span 1'
      }))

      expect(delivery).not.toHaveSentSpan(expect.objectContaining({
        name: 'span 2'
      }))

      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: 'span 3'
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
