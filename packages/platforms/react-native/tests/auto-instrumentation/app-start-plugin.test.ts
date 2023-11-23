import { MockSpanFactory, createConfiguration } from '@bugsnag/js-performance-test-utilities'
import { type Clock } from '@bugsnag/core-performance'
import createClock from '../../lib/clock'
import { AppStartPlugin } from '../../lib/auto-instrumentation/app-start-plugin'
import { type ReactNativeConfiguration } from '../../lib/config'
import { type AppRegistry } from 'react-native'
import { type PropsWithChildren } from 'react'

describe('app start plugin', () => {
  let spanFactory: MockSpanFactory<ReactNativeConfiguration>
  let clock: Clock
  let appRegistry: typeof AppRegistry

  beforeEach(() => {
    spanFactory = new MockSpanFactory()
    clock = createClock(performance)
    appRegistry = {
      setWrapperComponentProvider: jest.fn()
    } as unknown as typeof AppRegistry
  })

  it('starts an app start span when autoInstrumentAppStarts is true', () => {
    const appStartTime = 1234
    const plugin = new AppStartPlugin(appStartTime, spanFactory, clock, appRegistry)

    const originalSetWrapperComponentProvider = appRegistry.setWrapperComponentProvider as jest.MockedFunction<typeof appRegistry.setWrapperComponentProvider>

    plugin.configure(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: true }))

    expect(spanFactory.startSpan).toHaveBeenCalledWith('[AppStart/ReactNativeInit]',
      expect.objectContaining({
        startTime: appStartTime,
        parentContext: null
      }))

    expect(originalSetWrapperComponentProvider).toHaveBeenCalledWith(expect.any(Function))
  })

  it('does not start an app start span when autoInstrumentAppStarts is false', () => {
    const plugin = new AppStartPlugin(1234, spanFactory, clock, appRegistry)
    const originalSetWrapperComponentProvider = appRegistry.setWrapperComponentProvider as jest.MockedFunction<typeof appRegistry.setWrapperComponentProvider>
    plugin.configure(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: false }))

    expect(spanFactory.startSpan).not.toHaveBeenCalled()
    expect(originalSetWrapperComponentProvider).not.toHaveBeenCalled()
  })

  it('monkey patches setWrapperComponentProvider', () => {
    const appStartTime = 1234
    const plugin = new AppStartPlugin(appStartTime, spanFactory, clock, appRegistry)

    const mockSetWrapperComponentProvider = appRegistry.setWrapperComponentProvider as jest.MockedFunction<typeof appRegistry.setWrapperComponentProvider>

    plugin.configure(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: true }))

    expect(spanFactory.startSpan).toHaveBeenCalledWith('[AppStart/ReactNativeInit]',
      expect.objectContaining({
        startTime: appStartTime,
        parentContext: null
      }))

    expect(appRegistry.setWrapperComponentProvider).not.toBe(mockSetWrapperComponentProvider)

    // mock function should have been called prior to monkey-patching
    expect(mockSetWrapperComponentProvider).toHaveBeenCalledTimes(1)
    expect(mockSetWrapperComponentProvider).toHaveBeenCalledWith(expect.any(Function))

    // call the monkey-patched setWrapperComponentProvider
    const mockProvider = jest.fn((appParams) => ({ children }: PropsWithChildren) => children)
    appRegistry.setWrapperComponentProvider(mockProvider)

    // a diagnostic span should have been started
    expect(spanFactory.startSpan).toHaveBeenCalledWith('AppRegistry.setWrapperComponentProvider called',
      expect.objectContaining({ startTime: expect.any(Number) }))

    // the original setWrapperComponentProvider should have been called
    expect(mockSetWrapperComponentProvider).toHaveBeenCalledTimes(2)
  })
})
