import { MockSpanFactory, createConfiguration } from '@bugsnag/js-performance-test-utilities'
import { type ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import ReactNativeNavigationPlugin from '../lib/react-native-navigation-plugin'
import { Navigation } from 'react-native-navigation'

describe('ReactNativeNavigationPlugin', () => {
  it('is configurable', () => {
    const plugin = new ReactNativeNavigationPlugin(Navigation)
    const configuration = createConfiguration<ReactNativeConfiguration>()
    const spanFactory = new MockSpanFactory()
    expect(() => {
      plugin.configure(configuration, spanFactory)
    }).not.toThrow()
  })
})
