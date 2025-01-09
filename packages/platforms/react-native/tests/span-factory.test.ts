/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ReactNativeSpanFactory } from '../lib/span-factory'
import NativeBugsnagPerformance from '../lib/native'
import { ControllableBackgroundingListener, InMemoryProcessor, spanAttributesSource, StableIdGenerator } from '@bugsnag/js-performance-test-utilities'
import { DefaultSpanContextStorage, Sampler, DISCARD_END_TIME } from '@bugsnag/core-performance'
import type { InternalConfiguration } from '@bugsnag/core-performance'
import createClock from '../lib/clock'
import type { ReactNativeClock } from '../lib/clock'
import type { ReactNativeConfiguration } from '../lib/config'

let clock: ReactNativeClock
let spanFactory: ReactNativeSpanFactory
let processor: InMemoryProcessor
let contextStorage: DefaultSpanContextStorage
let backgroundingListener: ControllableBackgroundingListener

beforeEach(() => {
  jest.useFakeTimers()
  jest.resetModules()
  jest.clearAllMocks()

  clock = createClock(performance)
  processor = new InMemoryProcessor()
  backgroundingListener = new ControllableBackgroundingListener()
  contextStorage = new DefaultSpanContextStorage(backgroundingListener)
  spanFactory = new ReactNativeSpanFactory(
    processor,
    new Sampler(1.0),
    new StableIdGenerator(),
    spanAttributesSource,
    clock,
    backgroundingListener,
    jestLogger,
    contextStorage
  )
})

const jestLogger = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}

describe('ReactNativeSpanFactory', () => {
  describe('startSpan', () => {
    it('starts a native span when isFirstClass is true', () => {
      spanFactory.onAttach()

      const startTime = clock.now()
      const nativeSpan = spanFactory.startSpan('native span', { startTime, isFirstClass: true })
      expect(NativeBugsnagPerformance!.startNativeSpan).toHaveBeenCalledWith('native span', expect.objectContaining({ startTime: clock.toUnixNanoseconds(startTime) }))
      expect(contextStorage.current).toBe(nativeSpan)
    })

    it.each([false, undefined])('does not start a native span when isFirstClass is %p', isFirstClass => {
      spanFactory.onAttach()

      const startTime = clock.now()
      const span = spanFactory.startSpan('not first class', { startTime, isFirstClass })
      expect(NativeBugsnagPerformance!.startNativeSpan).not.toHaveBeenCalled()
      expect(contextStorage.current).toBe(span)
    })

    it('does not start a native span when doNotDelegateToNativeSDK is true', () => {
      spanFactory.onAttach()

      const startTime = clock.now()
      const span = spanFactory.startSpan('first class', { startTime, isFirstClass: true, doNotDelegateToNativeSDK: true })
      expect(NativeBugsnagPerformance!.startNativeSpan).not.toHaveBeenCalled()
      expect(contextStorage.current).toBe(span)
    })

    it('does not start a native span when not attached to native', () => {
      const startTime = clock.now()
      const span = spanFactory.startSpan('first class', { startTime, isFirstClass: true })
      expect(NativeBugsnagPerformance!.startNativeSpan).not.toHaveBeenCalled()
      expect(contextStorage.current).toBe(span)
    })

    it('sets the native parent context when parentContext is provided', () => {
      spanFactory.onAttach()

      const startTime = clock.now()
      const parentContext = spanFactory.startSpan('parent', { startTime, isFirstClass: false })
      const nativeSpan = spanFactory.startSpan('child', { startTime, isFirstClass: true, parentContext })
      expect(NativeBugsnagPerformance!.startNativeSpan).toHaveBeenCalledWith('child', expect.objectContaining({ parentContext: { id: parentContext.id, traceId: parentContext.traceId } }))
      expect(nativeSpan.id).toBe('native-span-id')
      expect(nativeSpan.traceId).toBe(parentContext.traceId)
      expect(nativeSpan.parentSpanId).toBe(parentContext.id)
      expect(contextStorage.current).toBe(nativeSpan)
    })

    it.each([null, undefined])('does not set the native parent context when parentContext is %p', parentContext => {
      spanFactory.onAttach()

      const startTime = clock.now()
      const nativeSpan = spanFactory.startSpan('child', { startTime, isFirstClass: true, parentContext })
      expect(NativeBugsnagPerformance!.startNativeSpan).toHaveBeenCalledWith('child', expect.objectContaining({ parentContext: undefined }))
      expect(nativeSpan.id).toBe('native-span-id')
      expect(nativeSpan.traceId).toBe('native-trace-id')
      expect(contextStorage.current).toBe(nativeSpan)
    })
  })

  describe('endSpan', () => {
    it('sends native spans to the native module', async () => {
      spanFactory.onAttach()

      const startTime = clock.now()
      const nativeSpan = spanFactory.startSpan('native span', { startTime, isFirstClass: true })
      expect(NativeBugsnagPerformance!.startNativeSpan).toHaveBeenCalledWith('native span', expect.objectContaining({ startTime: clock.toUnixNanoseconds(startTime) }))
      expect(contextStorage.current).toBe(nativeSpan)

      const endTime = clock.now()
      spanFactory.endSpan(nativeSpan, endTime, { 'additional.attribute': 'test' })
      await jest.runOnlyPendingTimersAsync()

      expect(contextStorage.current).toBeUndefined()
      expect(processor.spans.length).toBe(0)
      expect(NativeBugsnagPerformance!.endNativeSpan).toHaveBeenCalledWith(
        nativeSpan.id,
        nativeSpan.traceId,
        clock.toUnixNanoseconds(endTime),
        { 'bugsnag.span.first_class': true, 'additional.attribute': 'test' })
    })

    it('sends non-native spans to the JS processor', async () => {
      spanFactory.onAttach()
      const startTime = clock.now()
      const span = spanFactory.startSpan('not native', { startTime, isFirstClass: false })
      expect(NativeBugsnagPerformance!.startNativeSpan).not.toHaveBeenCalled()
      expect(contextStorage.current).toBe(span)

      const endTime = clock.now()
      spanFactory.endSpan(span, endTime)
      await jest.runOnlyPendingTimersAsync()

      expect(NativeBugsnagPerformance!.endNativeSpan).not.toHaveBeenCalled()
      expect(contextStorage.current).toBeUndefined()
      expect(processor.spans.length).toBe(1)
    })

    it('runs onSpanEnd callbacks for native spans', async () => {
      spanFactory.onAttach()

      const onSpanEndCallback = jest.fn((span) => {
        return Promise.resolve(span.name === 'should send')
      })

      spanFactory.configure({ logger: jestLogger, onSpanEnd: [onSpanEndCallback] } as unknown as InternalConfiguration<ReactNativeConfiguration>)
      const startTime = clock.now()
      const validSpan = spanFactory.startSpan('should send', { startTime, isFirstClass: true })
      expect(NativeBugsnagPerformance!.startNativeSpan).toHaveBeenCalledWith('should send', expect.objectContaining({ startTime: clock.toUnixNanoseconds(startTime) }))
      expect(contextStorage.current).toBe(validSpan)

      const invalidSpan = spanFactory.startSpan('should discard', { startTime, isFirstClass: true })
      expect(NativeBugsnagPerformance!.startNativeSpan).toHaveBeenCalledWith('should discard', expect.objectContaining({ startTime: clock.toUnixNanoseconds(startTime) }))
      expect(contextStorage.current).toBe(invalidSpan)

      const endTime = clock.now()
      spanFactory.endSpan(invalidSpan, endTime)
      await jest.runOnlyPendingTimersAsync()

      expect(onSpanEndCallback).toHaveBeenCalledTimes(1)
      expect(NativeBugsnagPerformance!.endNativeSpan).not.toHaveBeenCalled()
      expect(NativeBugsnagPerformance!.discardNativeSpan).toHaveBeenCalledTimes(1)

      spanFactory.endSpan(validSpan, endTime)
      await jest.runOnlyPendingTimersAsync()

      expect(onSpanEndCallback).toHaveBeenCalledTimes(2)
      expect(NativeBugsnagPerformance!.endNativeSpan).toHaveBeenCalledTimes(1)
      expect(NativeBugsnagPerformance!.discardNativeSpan).toHaveBeenCalledTimes(1)

      expect(processor.spans.length).toBe(0)
    })
  })

  describe('discardSpan', () => {
    it('calls discardNativeSpan for native spans', () => {
      spanFactory.onAttach()

      const startTime = clock.now()
      const nativeSpan = spanFactory.startSpan('native span', { startTime, isFirstClass: true })
      expect(NativeBugsnagPerformance!.startNativeSpan).toHaveBeenCalledWith('native span', expect.objectContaining({ startTime: clock.toUnixNanoseconds(startTime) }))

      spanFactory.endSpan(nativeSpan, DISCARD_END_TIME)
      expect(NativeBugsnagPerformance!.endNativeSpan).not.toHaveBeenCalled()
      expect(NativeBugsnagPerformance!.discardNativeSpan).toHaveBeenCalledWith(nativeSpan.id, nativeSpan.traceId)
    })

    it('does not call discardNativeSpan for non-native spans', () => {
      spanFactory.onAttach()

      const startTime = clock.now()
      const span = spanFactory.startSpan('not native', { startTime, isFirstClass: false })
      expect(NativeBugsnagPerformance!.startNativeSpan).not.toHaveBeenCalled()

      spanFactory.endSpan(span, DISCARD_END_TIME)
      expect(NativeBugsnagPerformance!.discardNativeSpan).not.toHaveBeenCalled()
      expect(NativeBugsnagPerformance!.endNativeSpan).not.toHaveBeenCalled()
      expect(processor.spans.length).toBe(0)
    })
  })

  describe('startNavigationSpan', () => {
    it('sets the span name to the route prefixed with [Navigation]', () => {
      const span = spanFactory.startNavigationSpan('testRoute', {})
      const endedSpan = span.end(12345, spanFactory.sampler.spanProbability)

      expect(endedSpan.name).toBe('[Navigation]testRoute')
    })

    it('always sets the span as first class', () => {
      const span = spanFactory.startNavigationSpan('testRoute', { isFirstClass: false })
      const endedSpan = span.end(12345, spanFactory.sampler.spanProbability)

      expect(endedSpan.attributes.toJson()).toContainEqual({ key: 'bugsnag.span.first_class', value: { boolValue: true } })
    })

    it('includes navigation category attribute', () => {
      const span = spanFactory.startNavigationSpan('testRoute', {})
      const endedSpan = span.end(12345, spanFactory.sampler.spanProbability)

      expect(endedSpan.attributes.toJson()).toContainEqual({ key: 'bugsnag.span.category', value: { stringValue: 'navigation' } })
    })

    it('includes the route attribute', () => {
      const span = spanFactory.startNavigationSpan('testRoute', {})
      const endedSpan = span.end(12345, spanFactory.sampler.spanProbability)

      expect(endedSpan.attributes.toJson()).toContainEqual({ key: 'bugsnag.navigation.route', value: { stringValue: 'testRoute' } })
    })
  })
})
