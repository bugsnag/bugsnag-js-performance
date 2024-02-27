import { MockSpanFactory, createConfiguration } from '@bugsnag/js-performance-test-utilities'
import { type ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import ReactNativeNavigationPlugin from '../lib/react-native-navigation-plugin'
import { Navigation } from 'react-native-navigation'

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

    jest.mocked(Navigation.events().registerComponentDidAppearListener).mock.calls[0][0]({
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
    expect(span).toHaveAttribute('bugsnag.span.first_class', false)
    expect(span).toHaveAttribute('bugsnag.navigation.route', 'TestScreen')
    expect(span).toHaveAttribute('bugsnag.navigation.triggered_by', '@bugsnag/react-native-navigation-performance')
  })
})
