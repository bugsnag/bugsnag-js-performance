import { MockSpanFactory, createConfiguration } from '@bugsnag/js-performance-test-utilities'
import { type ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import ReactNativeNavigationPlugin from '../lib/react-native-navigation-plugin'
import { Navigation } from 'react-native-navigation'

jest.mock('react-native-navigation', () => {
  return {
    Navigation: {
      events: jest.fn().mockReturnValue({
        registerCommandListener: jest.fn(),
        registerCommandCompletedListener: jest.fn(),
        registerComponentDidAppearListener: jest.fn()
      })
    }
  }
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

    jest.mocked(Navigation.events().registerCommandCompletedListener).mock.calls[0][0]({
      commandId: '1',
      completionTime: 1000,
      commandName: 'push'
    })

    expect(spanFactory.createdSpans).toContainEqual(expect.objectContaining({
      name: '[Navigation]TestScreen',
      startTime: expect.any(Number),
      endTime: 1000
    }))
  })
})
