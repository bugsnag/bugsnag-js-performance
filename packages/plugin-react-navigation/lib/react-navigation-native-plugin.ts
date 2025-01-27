import type { Plugin, SetAppState, SpanFactory } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import { NavigationContainer } from '@react-navigation/native'
import { createNavigationContainer } from './create-navigation-container'

class BugsnagPluginReactNavigationNativePerformance implements Plugin<ReactNativeConfiguration> {
  private spanFactory?: SpanFactory<ReactNativeConfiguration>
  private setAppState?: SetAppState

  configure (_configuration: ReactNativeConfiguration, spanFactory: SpanFactory<ReactNativeConfiguration>, setAppState: SetAppState) {
    this.spanFactory = spanFactory
    this.setAppState = setAppState
  }

  createNavigationContainer = (Container = NavigationContainer) => {
    if (!this.spanFactory || !this.setAppState) throw new Error('Bugsnag: BugsnagPluginReactNavigationNativePerformance not configured')
    return createNavigationContainer(Container, this.spanFactory, this.setAppState) as typeof Container
  }
}

export default BugsnagPluginReactNavigationNativePerformance
