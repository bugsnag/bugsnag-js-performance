/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ReactNativeSpanFactory } from '../lib/span-factory'
import NativeBugsnagPerformance from '../lib/native'
import { ControllableBackgroundingListener, InMemoryProcessor, spanAttributesSource, StableIdGenerator } from '@bugsnag/js-performance-test-utilities'
import { DefaultSpanContextStorage, Sampler } from '@bugsnag/core-performance'
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

  const timeOrigin = new Date('1970-01-01T00:00:00.000Z')
  jest.setSystemTime(timeOrigin)
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
    it('discards a native span', () => {
      spanFactory.onAttach()

      const startTime = clock.now()
      const nativeSpan = spanFactory.startSpan('native span', { startTime, isFirstClass: true })
      expect(NativeBugsnagPerformance!.startNativeSpan).toHaveBeenCalledWith('native span', expect.objectContaining({ startTime: clock.toUnixNanoseconds(startTime) }))

      backgroundingListener.sendToBackground()

      spanFactory.endSpan(nativeSpan, clock.now())
      expect(NativeBugsnagPerformance!.endNativeSpan).not.toHaveBeenCalled()
      expect(NativeBugsnagPerformance!.discardNativeSpan).toHaveBeenCalledWith(nativeSpan.id, nativeSpan.traceId)
    })

    it('does not discard a non-native span', () => {
      const startTime = clock.now()
      const span = spanFactory.startSpan('not native', { startTime, isFirstClass: false })
      expect(NativeBugsnagPerformance!.startNativeSpan).not.toHaveBeenCalled()

      spanFactory.endSpan(span, clock.now())
      expect(NativeBugsnagPerformance!.discardNativeSpan).not.toHaveBeenCalled()
      expect(NativeBugsnagPerformance!.endNativeSpan).not.toHaveBeenCalled()
    })
  })

  describe('createAppStartSpan', () => {
    it('creates an app start span with the supplied start time', () => {
      const appStartSpan = spanFactory.createAppStartSpan(12345)
      const appStartSpanEnded = appStartSpan.end(12345, spanFactory.sampler.spanProbability)

      expect(appStartSpanEnded.name).toBe('[AppStart/ReactNativeInit]')
      expect(appStartSpanEnded.startTime).toBe(12345)
    })

    it('sets the parent context to null', () => {
      spanFactory.startSpan('should not become parent', { startTime: 12345 })

      const appStartSpan = spanFactory.createAppStartSpan(12345)
      const appStartSpanEnded = appStartSpan.end(54321, spanFactory.sampler.spanProbability)

      expect(appStartSpanEnded.parentSpanId).toBeUndefined()
    })

    it('sets the required attributes', () => {
      const appStartSpan = spanFactory.createAppStartSpan(12345)
      const appStartSpanEnded = appStartSpan.end(12345, spanFactory.sampler.spanProbability)

      expect(appStartSpanEnded.attributes.toJson()).toStrictEqual([
        { key: 'bugsnag.span.category', value: { stringValue: 'app_start' } },
        { key: 'bugsnag.app_start.type', value: { stringValue: 'ReactNativeInit' } },
        { key: 'bugsnag.span.first_class', value: { boolValue: true } },
        { key: 'bugsnag.sampling.p', value: { doubleValue: 1 } }
      ])
    })

    it('prevents multiple app start spans from being created', () => {
      const startSpanSpy = jest.spyOn(spanFactory, 'startSpan')
      const appStartSpan1 = spanFactory.createAppStartSpan(12345)

      expect(startSpanSpy).toHaveBeenCalledTimes(1)

      const appStartSpan2 = spanFactory.createAppStartSpan(12345)

      expect(startSpanSpy).toHaveBeenCalledTimes(1)
      expect(appStartSpan1).toBe(appStartSpan2)
    })

    it('creates a JS app start span when not attached to native', () => {
      const startSpanSpy = jest.spyOn(spanFactory, 'startSpan')
      const appStartSpan = spanFactory.createAppStartSpan(12345)

      expect(startSpanSpy).toHaveBeenCalledTimes(1)
      expect(contextStorage.current).toBe(appStartSpan)
      expect(NativeBugsnagPerformance!.getAppStartSpan).not.toHaveBeenCalled()
    })

    it('creates a native app start span when attached to native', async () => {
      const startSpanSpy = jest.spyOn(spanFactory, 'startSpan')
      spanFactory.onAttach()

      const appStartSpan = spanFactory.createAppStartSpan(clock.now())
      expect(NativeBugsnagPerformance!.getAppStartSpan).toHaveBeenCalledTimes(1)
      expect(startSpanSpy).not.toHaveBeenCalled()

      // @ts-expect-error 'isNativeSpan' does not exist on type 'SpanInternal'
      expect(appStartSpan.isNativeSpan).toBe(true)
      expect(appStartSpan.id).toBe('native-app-start-id')
      expect(appStartSpan.traceId).toBe('native-app-start-trace-id')
      expect(contextStorage.current).toBe(appStartSpan)

      const endTime = clock.now()
      spanFactory.endSpan(appStartSpan, endTime)
      await jest.runOnlyPendingTimersAsync()

      expect(contextStorage.current).toBeUndefined()
      expect(processor.spans.length).toBe(0)
      expect(NativeBugsnagPerformance!.endNativeSpan).toHaveBeenCalledWith(
        appStartSpan.id,
        appStartSpan.traceId,
        clock.toUnixNanoseconds(endTime),
        {
          'bugsnag.span.category': 'app_start',
          'bugsnag.app_start.type': 'ReactNativeInit',
          'bugsnag.span.first_class': true
        }
      )
    })
  })
})
