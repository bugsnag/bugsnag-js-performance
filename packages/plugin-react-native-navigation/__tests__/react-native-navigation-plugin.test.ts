import { createConfiguration } from '@bugsnag/js-performance-test-utilities'
import type { MockReactNativeSpanFactory } from '@bugsnag/js-performance-test-utilities'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import { PluginContext } from '@bugsnag/core-performance'
import * as AppState from '@bugsnag/core-performance/lib/app-state'
import { Navigation } from 'react-native-navigation'
import ReactNativeNavigationPlugin from '../lib/react-native-navigation-plugin'
import BugsnagPerformance from '@bugsnag/react-native-performance'

jest.mock('react-native-navigation')

jest.spyOn(AppState, 'setAppState')

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  // @ts-expect-error spanFactory only exists in the mock
  BugsnagPerformance.spanFactory.reset()
  AppState.setAppState('starting')

  jest.clearAllMocks()
  jest.useRealTimers()
})

describe('ReactNativeNavigationPlugin', () => {
  it('creates a navigation span when the route changes', () => {
    const plugin = new ReactNativeNavigationPlugin(Navigation)
    const context = new PluginContext(createConfiguration<ReactNativeConfiguration>())

    plugin.install(context)
    plugin.start()

    expect(AppState.getAppState()).toBe('starting')

    // Simulate a route change
    jest.mocked(Navigation.events().registerCommandListener).mock.calls[0][0]('push', {
      commandId: '1',
      componentId: '123'
    })

    jest.mocked(Navigation.events().registerComponentWillAppearListener).mock.calls[0][0]({
      componentId: '123',
      componentName: 'TestScreen',
      componentType: 'Component'
    })

    expect(AppState.setAppState).toHaveBeenCalled()
    expect(AppState.getAppState()).toBe('navigating')

    jest.advanceTimersByTime(100)

    // @ts-expect-error spanFactory only exists in the mock
    const spanFactory = BugsnagPerformance.spanFactory as MockReactNativeSpanFactory

    expect(spanFactory.endSpan).toHaveBeenCalledTimes(1)
    expect(spanFactory.createdSpans).toHaveLength(1)

    expect(AppState.getAppState()).toBe('ready')

    const span = spanFactory.createdSpans[0]
    expect(span.name).toEqual('[Navigation]TestScreen')
    expect(span).toHaveAttribute('bugsnag.span.category', 'navigation')
    expect(span).toHaveAttribute('bugsnag.span.first_class', true)
    expect(span).toHaveAttribute('bugsnag.navigation.route', 'TestScreen')
    expect(span).toHaveAttribute('bugsnag.navigation.triggered_by', '@bugsnag/plugin-react-native-navigation-performance')
    expect(span).toHaveAttribute('bugsnag.navigation.ended_by', 'immediate')
  })

  it('does not end the current navigation while there are components waiting', () => {
    const plugin = new ReactNativeNavigationPlugin(Navigation)
    const context = new PluginContext(createConfiguration<ReactNativeConfiguration>())
    // @ts-expect-error spanFactory only exists in the mock
    const spanFactory = BugsnagPerformance.spanFactory as MockReactNativeSpanFactory
    plugin.install(context)
    plugin.start()

    expect(AppState.getAppState()).toBe('starting')

    // Simulate a route change
    jest.mocked(Navigation.events().registerCommandListener).mock.calls[0][0]('push', {
      commandId: '1',
      componentId: '123'
    })

    jest.mocked(Navigation.events().registerComponentWillAppearListener).mock.calls[0][0]({
      componentId: '123',
      componentName: 'TestScreen',
      componentType: 'Component'
    })

    expect(spanFactory.startSpan).toHaveBeenCalledTimes(1)

    expect(AppState.setAppState).toHaveBeenCalled()
    expect(AppState.getAppState()).toBe('navigating')

    plugin.blockNavigationEnd()
    plugin.blockNavigationEnd()
    plugin.blockNavigationEnd()

    jest.advanceTimersByTime(100)

    expect(spanFactory.endSpan).not.toHaveBeenCalled()

    plugin.unblockNavigationEnd('mount')
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).not.toHaveBeenCalled()

    plugin.unblockNavigationEnd('unmount')
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).not.toHaveBeenCalled()

    plugin.unblockNavigationEnd('condition')
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).toHaveBeenCalled()

    expect(AppState.setAppState).toHaveBeenCalled()
    expect(AppState.getAppState()).toBe('ready')

    const span = spanFactory.createdSpans[0]
    expect(span.name).toEqual('[Navigation]TestScreen')
    expect(span).toHaveAttribute('bugsnag.span.category', 'navigation')
    expect(span).toHaveAttribute('bugsnag.span.first_class', true)
    expect(span).toHaveAttribute('bugsnag.navigation.route', 'TestScreen')
    expect(span).toHaveAttribute('bugsnag.navigation.triggered_by', '@bugsnag/plugin-react-native-navigation-performance')
    expect(span).toHaveAttribute('bugsnag.navigation.ended_by', 'condition')
  })

  it('discards the active navigation span when the route changes', () => {
    const plugin = new ReactNativeNavigationPlugin(Navigation)
    const context = new PluginContext(createConfiguration<ReactNativeConfiguration>())

    plugin.install(context)
    plugin.start()

    expect(AppState.getAppState()).toBe('starting')

    // Simulate a route change
    jest.mocked(Navigation.events().registerCommandListener).mock.calls[0][0]('push', {
      commandId: '1',
      componentId: '1'
    })

    jest.mocked(Navigation.events().registerComponentWillAppearListener).mock.calls[0][0]({
      componentId: '1',
      componentName: 'FirstScreen',
      componentType: 'Component'
    })

    expect(AppState.getAppState()).toBe('navigating')

    jest.advanceTimersByTime(50)

    // Simulate a second route change
    jest.mocked(Navigation.events().registerCommandListener).mock.calls[0][0]('push', {
      commandId: '2',
      componentId: '2'
    })

    jest.mocked(Navigation.events().registerComponentWillAppearListener).mock.calls[0][0]({
      componentId: '2',
      componentName: 'SecondScreen',
      componentType: 'Component'
    })

    expect(AppState.getAppState()).toBe('navigating')

    jest.advanceTimersByTime(100)

    // @ts-expect-error spanFactory only exists in the mock
    const spanFactory = BugsnagPerformance.spanFactory as MockReactNativeSpanFactory
    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledTimes(2)
    expect(spanFactory.endSpan).toHaveBeenCalledTimes(1)
    expect(spanFactory.createdSpans).toHaveLength(1)

    expect(AppState.setAppState).toHaveBeenCalledTimes(3)
    expect(AppState.getAppState()).toBe('ready')

    const span = spanFactory.createdSpans[0]
    expect(span.name).toEqual('[Navigation]SecondScreen')
    expect(span).toHaveAttribute('bugsnag.span.category', 'navigation')
    expect(span).toHaveAttribute('bugsnag.span.first_class', true)
    expect(span).toHaveAttribute('bugsnag.navigation.route', 'SecondScreen')
    expect(span).toHaveAttribute('bugsnag.navigation.previous_route', 'FirstScreen')
    expect(span).toHaveAttribute('bugsnag.navigation.triggered_by', '@bugsnag/plugin-react-native-navigation-performance')
    expect(span).toHaveAttribute('bugsnag.navigation.ended_by', 'immediate')
  })
})
