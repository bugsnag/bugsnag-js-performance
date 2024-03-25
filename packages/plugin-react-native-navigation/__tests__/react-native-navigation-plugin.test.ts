import { MockSpanFactory, createConfiguration } from '@bugsnag/js-performance-test-utilities'
import { type ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import { Navigation } from 'react-native-navigation'
import ReactNativeNavigationPlugin from '../lib/react-native-navigation-plugin'

jest.mock('react-native-navigation')

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('ReactNativeNavigationPlugin', () => {
  it('creates a navigation span when the route changes', () => {
    const plugin = new ReactNativeNavigationPlugin(Navigation)
    const configuration = createConfiguration<ReactNativeConfiguration>()
    const spanFactory = new MockSpanFactory()
    plugin.configure(configuration, spanFactory)

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

    jest.advanceTimersByTime(100)

    expect(spanFactory.endSpan).toHaveBeenCalledTimes(1)
    expect(spanFactory.createdSpans).toHaveLength(1)

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
    const configuration = createConfiguration<ReactNativeConfiguration>()
    const spanFactory = new MockSpanFactory()
    plugin.configure(configuration, spanFactory)

    // Simulate a route change
    jest.mocked(Navigation.events().registerCommandListener).mock.calls[1][0]('push', {
      commandId: '1',
      componentId: '123'
    })

    jest.mocked(Navigation.events().registerComponentWillAppearListener).mock.calls[1][0]({
      componentId: '123',
      componentName: 'TestScreen',
      componentType: 'Component'
    })

    expect(spanFactory.startSpan).toHaveBeenCalledTimes(1)

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
    const configuration = createConfiguration<ReactNativeConfiguration>()
    const spanFactory = new MockSpanFactory()
    plugin.configure(configuration, spanFactory)

    // Simulate a route change
    jest.mocked(Navigation.events().registerCommandListener).mock.calls[2][0]('push', {
      commandId: '1',
      componentId: '1'
    })

    jest.mocked(Navigation.events().registerComponentWillAppearListener).mock.calls[2][0]({
      componentId: '1',
      componentName: 'FirstScreen',
      componentType: 'Component'
    })

    jest.advanceTimersByTime(50)

    // Simulate a second route change
    jest.mocked(Navigation.events().registerCommandListener).mock.calls[2][0]('push', {
      commandId: '2',
      componentId: '2'
    })

    jest.mocked(Navigation.events().registerComponentWillAppearListener).mock.calls[2][0]({
      componentId: '2',
      componentName: 'SecondScreen',
      componentType: 'Component'
    })

    jest.advanceTimersByTime(100)

    expect(spanFactory.startSpan).toHaveBeenCalledTimes(2)
    expect(spanFactory.endSpan).toHaveBeenCalledTimes(1)
    expect(spanFactory.createdSpans).toHaveLength(1)

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
