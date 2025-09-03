import { PluginContext } from '@bugsnag/core-performance'
import type { Clock } from '@bugsnag/core-performance'
import { MockReactNativeSpanFactory, createConfiguration } from '@bugsnag/js-performance-test-utilities'
import type { AppRegistry } from 'react-native'
import { AppStartPlugin, AppStartSpanQuery } from '../../lib/auto-instrumentation/app-start-plugin'
import type { AppStartSpanControl } from '../../lib/auto-instrumentation/app-start-plugin'
import createClock from '../../lib/clock'
import type { ReactNativeConfiguration } from '../../lib/config'
import { SpanQuery } from '@bugsnag/core-performance/lib'

describe('app start plugin', () => {
  let spanFactory: MockReactNativeSpanFactory
  let clock: Clock
  let appRegistry: typeof AppRegistry

  beforeEach(() => {
    spanFactory = new MockReactNativeSpanFactory()
    clock = createClock(performance)
    appRegistry = {
      setWrapperComponentProvider: jest.fn()
    } as unknown as typeof AppRegistry
  })

  it('starts an app start span when autoInstrumentAppStarts is true', () => {
    const appStartTime = 1234
    const plugin = new AppStartPlugin(appStartTime, spanFactory, clock, appRegistry)

    const context = new PluginContext(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: true }), clock)
    plugin.install(context)
    plugin.start()

    expect(spanFactory.startSpan).toHaveBeenCalledWith('[AppStart/ReactNativeInit]',
      expect.objectContaining({
        startTime: appStartTime,
        parentContext: null
      }))

    expect(appRegistry.setWrapperComponentProvider).toHaveBeenCalledWith(expect.any(Function))
  })

  it('does not start an app start span when autoInstrumentAppStarts is false', () => {
    const plugin = new AppStartPlugin(1234, spanFactory, clock, appRegistry)

    const context = new PluginContext(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: false }), clock)
    plugin.install(context)
    plugin.start()

    expect(spanFactory.startSpan).not.toHaveBeenCalled()
    expect(appRegistry.setWrapperComponentProvider).not.toHaveBeenCalled()
  })

  describe('getSpanControls', () => {
    it('returns an AppStartSpanControl for a valid query', () => {
      const plugin = new AppStartPlugin(1234, spanFactory, clock, appRegistry)

      const context = new PluginContext(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: true }), clock)
      plugin.install(context)
      expect(context.spanControlProviders.length).toBe(1)

      plugin.start()

      const control1 = plugin.getSpanControls(AppStartSpanQuery)
      expect(control1).toEqual({
        setType: expect.any(Function),
        clearType: expect.any(Function)
      })

      const control2 = plugin.getSpanControls(new AppStartSpanQuery())
      expect(control2).toEqual({
        setType: expect.any(Function),
        clearType: expect.any(Function)
      })
    })

    it('returns null for an invalid query', () => {
      const plugin = new AppStartPlugin(1234, spanFactory, clock, appRegistry)

      const context = new PluginContext(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: true }), clock)
      plugin.install(context)
      plugin.start()

      class InvalidQuery extends SpanQuery<AppStartSpanControl> {}

      const control1 = plugin.getSpanControls(new InvalidQuery())
      expect(control1).toBe(null)
    })

    it('returns null if the app start span has ended', () => {
      const plugin = new AppStartPlugin(1234, spanFactory, clock, appRegistry)

      const context = new PluginContext(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: true }), clock)
      plugin.install(context)
      plugin.start()

      // Simulate the end of the app start span
      spanFactory.endAppStartSpan(clock.now())

      const control1 = plugin.getSpanControls(AppStartSpanQuery)
      expect(control1).toBe(null)
    })

    it('provides span controls for manually instrumented app starts (autoInstrumentAppStarts = false)', () => {
      const plugin = new AppStartPlugin(1234, spanFactory, clock, appRegistry)

      const context = new PluginContext(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: false }), clock)
      plugin.install(context)
      expect(context.spanControlProviders.length).toBe(1)

      // No automatic app start span as autoInstrumentAppStarts is false
      plugin.start()

      const nullSpanControl = plugin.getSpanControls(AppStartSpanQuery)
      expect(nullSpanControl).toBe(null)

      // Start the app start span
      spanFactory.startAppStartSpan(clock.now())

      // Get the span controls after starting the span
      const spanControl = plugin.getSpanControls(AppStartSpanQuery)
      expect(spanControl).toStrictEqual({
        setType: expect.any(Function),
        clearType: expect.any(Function)
      })
    })
  })

  describe('AppStartSpanControl', () => {
    let spanControl: AppStartSpanControl

    beforeEach(() => {
      const plugin = new AppStartPlugin(1234, spanFactory, clock, appRegistry)

      const context = new PluginContext(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: true }), clock)
      plugin.install(context)
      plugin.start()

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      spanControl = plugin.getSpanControls(AppStartSpanQuery)!
    })

    describe('setType', () => {
      it('updates the app start span name and attribute', () => {
        spanControl.setType('Test')
        expect(spanFactory.appStartSpan?.name).toBe('[AppStart/ReactNativeInit]Test')

        // @ts-expect-error span attributes are private
        expect(spanFactory.appStartSpan?.attributes.attributes.get('bugsnag.app_start.name')).toBe('Test')
      })

      it.each([null, undefined])('resets the app start span name and attribute when called with %p', (input) => {
        spanControl.setType('Test')
        expect(spanFactory.appStartSpan?.name).toBe('[AppStart/ReactNativeInit]Test')

        // @ts-expect-error span attributes are private
        expect(spanFactory.appStartSpan?.attributes.attributes.get('bugsnag.app_start.name')).toBe('Test')

        spanControl.setType(input)
        expect(spanFactory.appStartSpan?.name).toBe('[AppStart/ReactNativeInit]')

        // @ts-expect-error span attributes are private
        expect(spanFactory.appStartSpan?.attributes.attributes.get('bugsnag.app_start.name')).toBeUndefined()
      })

      it.each([
        123,
        {},
        () => {}
      ])('handles invalid inputs (%p)', (input) => {
        spanControl.setType('Test')
        spanControl.setType(input as unknown as string)
        expect(spanFactory.appStartSpan?.name).toBe('[AppStart/ReactNativeInit]Test')

        // @ts-expect-error span attributes are private
        expect(spanFactory.appStartSpan?.attributes.attributes.get('bugsnag.app_start.name')).toBe('Test')
      })

      it('noops if the app start span is invalid', () => {
        spanFactory.endAppStartSpan(clock.now())

        spanControl.setType('Test')
        expect(spanFactory.createdSpans[0].name).toBe('[AppStart/ReactNativeInit]')
        // @ts-expect-error span attributes are private
        expect(spanFactory.createdSpans[0].attributes.attributes.get('bugsnag.app_start.name')).toBeUndefined()
      })
    })

    describe('clearType', () => {
      it('resets the app start span name and attribute', () => {
        spanControl.setType('Test')
        expect(spanFactory.appStartSpan?.name).toBe('[AppStart/ReactNativeInit]Test')

        // @ts-expect-error span attributes are private
        expect(spanFactory.appStartSpan?.attributes.attributes.get('bugsnag.app_start.name')).toBe('Test')

        spanControl.clearType()
        expect(spanFactory.appStartSpan?.name).toBe('[AppStart/ReactNativeInit]')

        // @ts-expect-error span attributes are private
        expect(spanFactory.appStartSpan?.attributes.attributes.get('bugsnag.app_start.name')).toBeUndefined()
      })

      it('noops if the app start span is invalid', () => {
        spanControl.setType('Test')
        expect(spanFactory.appStartSpan?.name).toBe('[AppStart/ReactNativeInit]Test')

        // @ts-expect-error span attributes are private
        expect(spanFactory.appStartSpan?.attributes.attributes.get('bugsnag.app_start.name')).toBe('Test')

        spanFactory.endAppStartSpan(clock.now())

        spanControl.clearType()
        expect(spanFactory.createdSpans[0].name).toBe('[AppStart/ReactNativeInit]Test')
        // @ts-expect-error span attributes are private
        expect(spanFactory.createdSpans[0].attributes.attributes.get('bugsnag.app_start.name')).toBe('Test')
      })
    })
  })
})
