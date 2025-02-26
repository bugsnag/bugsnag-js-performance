import type { AppState, Clock, SetAppState } from '@bugsnag/core-performance'
import { MockSpanFactory, createConfiguration } from '@bugsnag/js-performance-test-utilities'
import type { AppRegistry } from 'react-native'
import { AppStartPlugin } from '../../lib/auto-instrumentation/app-start-plugin'
import createClock from '../../lib/clock'
import type { ReactNativeConfiguration } from '../../lib/config'
import type { ReactNativeSpanFactory } from '../../lib/span-factory'

describe('app start plugin', () => {
  let spanFactory: MockSpanFactory<ReactNativeConfiguration>
  let clock: Clock
  let appRegistry: typeof AppRegistry
  const setAppState: SetAppState = jest.fn()
  const appState: AppState = 'starting'

  beforeEach(() => {
    spanFactory = new MockSpanFactory()
    clock = createClock(performance)
    appRegistry = {
      setWrapperComponentProvider: jest.fn()
    } as unknown as typeof AppRegistry
  })

  it('starts an app start span when autoInstrumentAppStarts is true', () => {
    const appStartTime = 1234
    const plugin = new AppStartPlugin(appStartTime, spanFactory as unknown as ReactNativeSpanFactory, clock, appRegistry, setAppState, appState)

    plugin.configure(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: true }))

    expect(spanFactory.startSpan).toHaveBeenCalledWith('[AppStart/ReactNativeInit]',
      expect.objectContaining({
        startTime: appStartTime,
        parentContext: null
      }))

    expect(appRegistry.setWrapperComponentProvider).toHaveBeenCalledWith(expect.any(Function))
  })

  it('does not start an app start span when autoInstrumentAppStarts is false', () => {
    const plugin = new AppStartPlugin(1234, spanFactory as unknown as ReactNativeSpanFactory, clock, appRegistry, setAppState, appState)

    plugin.configure(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: false }))

    expect(spanFactory.startSpan).not.toHaveBeenCalled()
    expect(appRegistry.setWrapperComponentProvider).not.toHaveBeenCalled()
  })
})
