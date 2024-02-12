import { MockSpanFactory, createConfiguration } from '@bugsnag/js-performance-test-utilities'
import { type ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import ReactNativeNavigationPlugin from '../lib/react-native-navigation-plugin'

describe('ReactNativeNavigationPlugin', () => {
  it('has a configure method', () => {
    expect(() => {
      const plugin = new ReactNativeNavigationPlugin()
      const configuration = createConfiguration<ReactNativeConfiguration>()
      const spanFactory = new MockSpanFactory()
      plugin.configure(configuration, spanFactory)
    }).not.toThrow()
  })
})
