import { PluginContext, RemoteParentContext } from '@bugsnag/core-performance'
import { createConfiguration, IncrementingClock, IncrementingIdGenerator, MockSpanFactory } from '@bugsnag/js-performance-test-utilities'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import { BugsnagJavascriptSpansPlugin } from '../lib/javascript-spans-plugin'
import { TurboModuleRegistry, NativeEventEmitter } from 'react-native'

const SPAN_UPDATE_EVENT_TYPE = 'bugsnag:spanUpdate'
const SPAN_CONTEXT_EVENT_TYPE = 'bugsnag:spanContext'

describe('BugsnagJavascriptSpansPlugin', () => {
  let plugin: BugsnagJavascriptSpansPlugin
  let context: PluginContext<ReactNativeConfiguration>
  let mockNativeModule: any
  let clock: IncrementingClock

  beforeEach(() => {
    jest.useFakeTimers()

    // Get the mocked native module
    mockNativeModule = TurboModuleRegistry.get('BugsnagNativeSpans')
    clock = new IncrementingClock('2025-01-01T00:00:00.000Z')
    plugin = new BugsnagJavascriptSpansPlugin()
    context = new PluginContext<ReactNativeConfiguration>(
      createConfiguration<ReactNativeConfiguration>(),
      clock
    )

    // Clear all mock calls before each test
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('install', () => {
    it('should add callbacks and event listener when native module is available', () => {
      plugin.install(context)

      expect(context.onSpanStartCallbacks.length).toBe(1)
      expect(context.onSpanEndCallbacks.length).toBe(1)

      // Verify NativeEventEmitter was created and listener was added
      expect(NativeEventEmitter).toHaveBeenCalledWith(mockNativeModule)

      // Get the created event emitter instance
      const eventEmitter = jest.mocked(NativeEventEmitter).mock.results[0].value
      expect(eventEmitter.addListener).toHaveBeenCalledWith(
        SPAN_UPDATE_EVENT_TYPE,
        expect.any(Function)
      )
      expect(eventEmitter.addListener).toHaveBeenCalledWith(
        SPAN_CONTEXT_EVENT_TYPE,
        expect.any(Function)
      )
    })

    it('throws an error when native module is not available', () => {
      jest.isolateModules(() => {
        jest.mock('react-native', () => {
          return {
            NativeModules: {},
            TurboModuleRegistry: {
              get () {
                return null
              }
            }
          }
        })

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { BugsnagJavascriptSpansPlugin } = require('../lib/javascript-spans-plugin')
        const testPlugin = new BugsnagJavascriptSpansPlugin()

        expect(() => { testPlugin.install(context) }).toThrow('BugsnagNativeSpans module is not available. Ensure the native module is linked correctly.')
        expect(context.onSpanStartCallbacks.length).toBe(0)
        expect(context.onSpanEndCallbacks.length).toBe(0)
      })
    })
  })

  describe('start', () => {
    it('should trigger cleanup when started', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      plugin.start()

      expect(setTimeoutSpy).toHaveBeenCalledTimes(1)
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 60 * 60 * 1000) // 1 hour
    })
  })

  describe('span tracking', () => {
    let eventEmitter: NativeEventEmitter

    beforeEach(() => {
      plugin.install(context)
      eventEmitter = jest.mocked(NativeEventEmitter).mock.results[0].value
    })

    it('should track spans when onSpanStart is called', () => {
      const spanFactory = new MockSpanFactory()
      const mockSpan = spanFactory.toPublicApi(spanFactory.startSpan('testSpan', {}))

      const onSpanStartCallback = context.onSpanStartCallbacks[0].item
      onSpanStartCallback(mockSpan)

      // Verify span is tracked by sending an update event
      const updateEvent = {
        id: 123,
        name: 'testSpan',
        attributes: [],
        isEnded: false
      }

      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, updateEvent)

      // Verify success was reported to native
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledWith(123, true)
    })

    it('should only track the latest span for a given name', () => {
      const spanFactory = new MockSpanFactory()
      const testSpan1 = spanFactory.startSpan('testSpan', {})
      const testSpan2 = spanFactory.startSpan('testSpan', {})
      const onSpanStartCallback = context.onSpanStartCallbacks[0].item

      // Second span should replace the first
      onSpanStartCallback(spanFactory.toPublicApi(testSpan1))
      onSpanStartCallback(spanFactory.toPublicApi(testSpan2))

      const updateEvent = {
        id: 123,
        name: 'testSpan',
        attributes: [
          { name: 'attr1', value: 'value1' }
        ],
        isEnded: false
      }

      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, updateEvent)

      // Should report success since the second span is being tracked
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledWith(123, true)
      expect(testSpan1).not.toHaveAttribute('attr1')
      expect(testSpan2).toHaveAttribute('attr1', 'value1')
    })

    it('should remove spans when onSpanEnd is called with matching id and traceId', () => {
      const spanFactory = new MockSpanFactory()
      const span = spanFactory.toPublicApi(spanFactory.startSpan('testSpan', {}))

      const onSpanStartCallback = context.onSpanStartCallbacks[0].item
      const onSpanEndCallback = context.onSpanEndCallbacks[0].item

      // Track the span
      onSpanStartCallback(span)

      // Verify span is tracked before ending
      const updateEvent = {
        id: 123,
        name: 'testSpan',
        attributes: [
          { name: 'attr1', value: 'value1' }
        ],
        isEnded: false
      }

      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, updateEvent)
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledTimes(1)
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledWith(123, true)

      // End the span
      const result = onSpanEndCallback(span)
      expect(result).toBe(true)

      // Clear previous calls before testing again
      mockNativeModule.reportSpanUpdateResult.mockClear()

      // Try to update the span again - should still work since span end doesn't remove from tracking
      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, updateEvent)
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledTimes(1)
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledWith(123, false)
    })

    it('should not remove spans when onSpanEnd is called with different id or traceId', () => {
      const spanFactory = new MockSpanFactory({ idGenerator: new IncrementingIdGenerator() })
      const trackedSpan = spanFactory.toPublicApi(spanFactory.startSpan('testSpan', {}))
      const differentSpan = spanFactory.toPublicApi(spanFactory.startSpan('testSpan', {}))

      const onSpanStartCallback = context.onSpanStartCallbacks[0].item
      const onSpanEndCallback = context.onSpanEndCallbacks[0].item

      // Track the first span
      onSpanStartCallback(trackedSpan)

      // End a different span with the same name
      const result = onSpanEndCallback(differentSpan)
      expect(result).toBe(true)

      // Verify the original span is still tracked using update event
      const updateEvent = {
        id: 123,
        name: 'testSpan',
        attributes: [],
        isEnded: false
      }

      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, updateEvent)
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledWith(123, true)
    })
  })

  describe('native span updates', () => {
    let eventEmitter: NativeEventEmitter

    beforeEach(() => {
      plugin.install(context)
      eventEmitter = jest.mocked(NativeEventEmitter).mock.results[0].value
    })

    it('should handle span attribute updates from native events', () => {
      const spanFactory = new MockSpanFactory()
      const span = spanFactory.startSpan('testSpan', {})

      const onSpanStartCallback = context.onSpanStartCallbacks[0].item
      onSpanStartCallback(spanFactory.toPublicApi(span))

      // Simulate a native span update event
      const updateEvent = {
        id: 123,
        name: 'testSpan',
        attributes: [
          { name: 'attr1', value: 'value1' },
          { name: 'attr2', value: 42 }
        ],
        isEnded: false
      }

      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, updateEvent)

      // Verify attributes were set on the span
      expect(span).toHaveAttribute('attr1', 'value1')
      expect(span).toHaveAttribute('attr2', 42)
      expect(span.isValid()).toBe(true)

      // Verify success was reported to native
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledWith(123, true)
    })

    it('should handle span end from native events', () => {
      const spanFactory = new MockSpanFactory({ clock })
      const span = spanFactory.startSpan('testSpan', {})

      const onSpanStartCallback = context.onSpanStartCallbacks[0].item
      onSpanStartCallback(spanFactory.toPublicApi(span))

      // Simulate a native span end event
      const endTime = new Date('2025-01-01T00:00:00.500Z').getTime() // 500ms later
      const updateEvent = {
        id: 123,
        name: 'testSpan',
        attributes: [],
        isEnded: true,
        endTime: endTime * 1000000 // Convert to nanoseconds
      }

      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, updateEvent)

      // @ts-expect-error endTime is private
      expect(span.endTime).toBe(500)
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledWith(123, true)
    })

    it('should report failure when span is not found', () => {
      // Simulate an update for a span that doesn't exist
      const updateEvent = {
        id: 123,
        name: 'nonExistentSpan',
        attributes: [],
        isEnded: false
      }

      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, updateEvent)

      // Verify failure was reported to native
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledWith(123, false)
    })

    it('should handle events with empty attributes array', () => {
      const spanFactory = new MockSpanFactory()
      const mockSpan = spanFactory.toPublicApi(spanFactory.startSpan('testSpan', {}))
      const setAttributeSpy = jest.spyOn(mockSpan, 'setAttribute')

      const onSpanStartCallback = context.onSpanStartCallbacks[0].item
      onSpanStartCallback(mockSpan)

      // Simulate an update with empty attributes
      const updateEvent = {
        id: 123,
        name: 'testSpan',
        attributes: [],
        isEnded: false
      }

      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, updateEvent)

      // Verify no attributes were set but success was still reported
      expect(setAttributeSpy).not.toHaveBeenCalled()
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledWith(123, true)
    })

    it('should handle events with null/undefined attributes', () => {
      const spanFactory = new MockSpanFactory()
      const mockSpan = spanFactory.toPublicApi(spanFactory.startSpan('testSpan', {}))
      const setAttributeSpy = jest.spyOn(mockSpan, 'setAttribute')
      const onSpanStartCallback = context.onSpanStartCallbacks[0].item
      onSpanStartCallback(mockSpan)

      // Simulate an update with null attributes
      const updateEvent = {
        id: 123,
        name: 'testSpan',
        attributes: null,
        isEnded: false
      }

      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, updateEvent)

      // Verify no attributes were set but success was still reported
      expect(setAttributeSpy).not.toHaveBeenCalled()
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledWith(123, true)
    })
  })

  describe('span context events', () => {
    let eventEmitter: NativeEventEmitter

    beforeEach(() => {
      plugin.install(context)
      eventEmitter = jest.mocked(NativeEventEmitter).mock.results[0].value
    })

    it('should return trace parent string when span is found', () => {
      const spanFactory = new MockSpanFactory()
      const span = spanFactory.toPublicApi(spanFactory.startSpan('testSpan', {}))

      const onSpanStartCallback = context.onSpanStartCallbacks[0].item
      onSpanStartCallback(span)

      // Simulate a span context event
      const contextEvent = {
        id: 123,
        name: 'testSpan'
      }

      eventEmitter.emit(SPAN_CONTEXT_EVENT_TYPE, contextEvent)

      // Verify trace parent string was reported to native
      expect(mockNativeModule.reportSpanContextResult).toHaveBeenCalledWith(
        123,
        RemoteParentContext.toTraceParentString(span)
      )
    })

    it('should return null when span is not found', () => {
      // Simulate a context event for a span that doesn't exist
      const contextEvent = {
        id: 123,
        name: 'nonExistentSpan'
      }

      eventEmitter.emit(SPAN_CONTEXT_EVENT_TYPE, contextEvent)

      // Verify null was reported to native
      expect(mockNativeModule.reportSpanContextResult).toHaveBeenCalledWith(123, null)
    })

    it('should return null for an ended span', () => {
      const spanFactory = new MockSpanFactory()
      const span = spanFactory.toPublicApi(spanFactory.startSpan('testSpan', {}))

      const onSpanStartCallback = context.onSpanStartCallbacks[0].item
      const onSpanEndCallback = context.onSpanEndCallbacks[0].item

      onSpanStartCallback(span)

      // End the span
      onSpanEndCallback(span)

      // Simulate a context event for the ended span
      const contextEvent = {
        id: 123,
        name: 'testSpan'
      }

      eventEmitter.emit(SPAN_CONTEXT_EVENT_TYPE, contextEvent)

      // Verify null was reported since span was removed from tracking
      expect(mockNativeModule.reportSpanContextResult).toHaveBeenCalledWith(123, null)
    })
  })

  describe('cleanup', () => {
    let eventEmitter: NativeEventEmitter

    beforeEach(() => {
      plugin.install(context)
      eventEmitter = jest.mocked(NativeEventEmitter).mock.results[0].value
    })

    it('should schedule periodic cleanup every hour', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      plugin.start()

      expect(setTimeoutSpy).toHaveBeenCalledTimes(1)
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 60 * 60 * 1000)

      // Simulate the timeout firing
      jest.advanceTimersByTime(60 * 60 * 1000)

      // Should schedule another cleanup
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2)
    })

    it('should clear existing timeout before setting new one', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      // Start twice to test timeout clearing
      plugin.start()
      plugin.start()

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1)
    })

    it('should clean up invalid spans', () => {
      const spanFactory = new MockSpanFactory()
      const validSpan = spanFactory.toPublicApi(spanFactory.startSpan('validSpan', {}))
      const invalidSpan = spanFactory.toPublicApi(spanFactory.startSpan('invalidSpan', {}))

      const onSpanStartCallback = context.onSpanStartCallbacks[0].item

      // Track both spans
      onSpanStartCallback(validSpan)
      onSpanStartCallback(invalidSpan)

      const validSpanUpdateEvent = {
        id: 123,
        name: 'validSpan'
      }

      const invalidSpanUpdateEvent = {
        id: 456,
        name: 'invalidSpan'
      }

      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, validSpanUpdateEvent)
      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, invalidSpanUpdateEvent)

      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledTimes(2)
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenNthCalledWith(1, 123, true)
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenNthCalledWith(2, 456, true)

      // Invalidate one span
      invalidSpan.end()

      // Start the plugin to trigger cleanup
      plugin.start()

      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, validSpanUpdateEvent)
      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, invalidSpanUpdateEvent)

      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledTimes(4)
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenNthCalledWith(3, 123, true)
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenNthCalledWith(4, 456, false)
    })

    it('should clean up invalid spans during periodic cleanup', () => {
      // Start the plugin to initialise periodic cleanup
      plugin.start()
      const spanFactory = new MockSpanFactory()
      const validSpan = spanFactory.toPublicApi(spanFactory.startSpan('validSpan', {}))
      const invalidSpan = spanFactory.toPublicApi(spanFactory.startSpan('invalidSpan', {}))

      const onSpanStartCallback = context.onSpanStartCallbacks[0].item

      // Track both spans
      onSpanStartCallback(validSpan)
      onSpanStartCallback(invalidSpan)

      const validSpanUpdateEvent = {
        id: 123,
        name: 'validSpan'
      }

      const invalidSpanUpdateEvent = {
        id: 456,
        name: 'invalidSpan'
      }

      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, validSpanUpdateEvent)
      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, invalidSpanUpdateEvent)

      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledTimes(2)
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenNthCalledWith(1, 123, true)
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenNthCalledWith(2, 456, true)

      // Invalidate one span
      invalidSpan.end()

      // Advance time to trigger cleanup
      jest.advanceTimersByTime(60 * 60 * 1000)

      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, validSpanUpdateEvent)
      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, invalidSpanUpdateEvent)

      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenCalledTimes(4)
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenNthCalledWith(3, 123, true)
      expect(mockNativeModule.reportSpanUpdateResult).toHaveBeenNthCalledWith(4, 456, false)
    })
  })
})
