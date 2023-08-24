import { MockSpanFactory, createConfiguration } from '@bugsnag/js-performance-test-utilities'
import { type Clock } from '@bugsnag/core-performance'
import createClock from '../../lib/clock'
import { AppStartPlugin } from '../../lib/auto-instrumentation/app-start-plugin'
import { type ReactNativeConfiguration } from '../../lib/config'
import { type AppRegistry } from 'react-native'

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

  it('starts an app start span when autInstrumentAppStarts is true', () => {
    const plugin = new AppStartPlugin(spanFactory, clock, appRegistry)

    plugin.configure(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: true }))

    expect(spanFactory.startSpan).toHaveBeenCalledWith('[AppStart/ReactNativeInit]',
      expect.objectContaining({
        startTime: expect.any(Number),
        parentContext: null
      }))

    expect(appRegistry.setWrapperComponentProvider).toHaveBeenCalledWith(expect.any(Function))
  })

  it('does not start an app start span when autInstrumentAppStarts is false', () => {
    const plugin = new AppStartPlugin(spanFactory, clock, appRegistry)

    plugin.configure(createConfiguration<ReactNativeConfiguration>({ autoInstrumentAppStarts: false }))

    expect(spanFactory.startSpan).not.toHaveBeenCalled()
    expect(appRegistry.setWrapperComponentProvider).not.toHaveBeenCalled()
  })
})
