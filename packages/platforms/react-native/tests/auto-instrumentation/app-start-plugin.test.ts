import { ControllableBackgroundingListener, InMemoryProcessor, StableIdGenerator, createConfiguration, spanAttributesSource } from '@bugsnag/js-performance-test-utilities'
import { DefaultSpanContextStorage, Sampler } from '@bugsnag/core-performance'
import createClock from '../../lib/clock'
import type { ReactNativeClock } from '../../lib/clock'
import { AppStartPlugin } from '../../lib/auto-instrumentation/app-start-plugin'
import type { ReactNativeConfiguration } from '../../lib/config'
import type { AppRegistry } from 'react-native'
import { ReactNativeSpanFactory } from '../../lib/span-factory'

const jestLogger = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}

describe('app start plugin', () => {
  let clock: ReactNativeClock
  let spanFactory: ReactNativeSpanFactory
  let appRegistry: typeof AppRegistry
  let appStartSpy: jest.SpyInstance

  beforeEach(() => {
    clock = createClock(performance)
    const backgroundingListener = new ControllableBackgroundingListener()
    spanFactory = new ReactNativeSpanFactory(
      new InMemoryProcessor(),
      new Sampler(1.0),
      new StableIdGenerator(),
      spanAttributesSource,
      clock,
      backgroundingListener,
      jestLogger,
      new DefaultSpanContextStorage(backgroundingListener)
    )

    appRegistry = {
      setWrapperComponentProvider: jest.fn()
    } as unknown as typeof AppRegistry

    appStartSpy = jest.spyOn(spanFactory, 'createAppStartSpan')
  })

  it('starts an app start span when autoInstrumentAppStarts is true', () => {
    const appStartTime = 1234
    const plugin = new AppStartPlugin(appStartTime, spanFactory as unknown as ReactNativeSpanFactory, clock, appRegistry)

    plugin.configure(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: true }))

    expect(appStartSpy).toHaveBeenCalledWith(appStartTime)

    expect(appRegistry.setWrapperComponentProvider).toHaveBeenCalledWith(expect.any(Function))
  })

  it('does not start an app start span when autoInstrumentAppStarts is false', () => {
    const plugin = new AppStartPlugin(1234, spanFactory as unknown as ReactNativeSpanFactory, clock, appRegistry)

    plugin.configure(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: false }))

    expect(appStartSpy).not.toHaveBeenCalled()
    expect(appRegistry.setWrapperComponentProvider).not.toHaveBeenCalled()
  })
})
