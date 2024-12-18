import type { Plugin, SpanFactory } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration, ReactNativeSpanFactory } from '@bugsnag/react-native-performance'
import { NavigationContainer } from '@react-navigation/native'
import { createNavigationContainer } from './create-navigation-container'

class BugsnagPluginReactNavigationNativePerformance implements Plugin<ReactNativeConfiguration> {
  private spanFactory?: ReactNativeSpanFactory

  configure (_configuration: ReactNativeConfiguration, spanFactory: SpanFactory<ReactNativeConfiguration>) {
    this.spanFactory = spanFactory as ReactNativeSpanFactory
  }

  createNavigationContainer = (Container = NavigationContainer) => {
    if (!this.spanFactory) throw new Error('Bugsnag: BugsnagPluginReactNavigationNativePerformance not configured')
    return createNavigationContainer(Container, this.spanFactory) as typeof Container
  }
}

export default BugsnagPluginReactNavigationNativePerformance
