import { PluginContext } from '@bugsnag/core-performance'
import type { Clock } from '@bugsnag/core-performance'
import { MockReactNativeSpanFactory, createConfiguration } from '@bugsnag/js-performance-test-utilities'
import type { AppRegistry } from 'react-native'
import { AppStartPlugin } from '../../lib/auto-instrumentation/app-start-plugin'
import createClock from '../../lib/clock'
import type { ReactNativeConfiguration } from '../../lib/config'
import type { ReactNativeSpanFactory } from '../../lib/span-factory'

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
})
