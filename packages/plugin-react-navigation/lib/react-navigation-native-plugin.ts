import type { Plugin, SetAppState, SpanFactory } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration, ReactNativeSpanFactory } from '@bugsnag/react-native-performance'
import { NavigationContainer } from '@react-navigation/native'
import { createNavigationContainer } from './create-navigation-container'
import { NavigationTracker } from './navigation-tracker'

class BugsnagPluginReactNavigationNativePerformance implements Plugin<ReactNativeConfiguration> {
  private spanFactory?: ReactNativeSpanFactory
  private setAppState?: SetAppState
  private navigationTracker?: NavigationTracker

  configure (_configuration: ReactNativeConfiguration, spanFactory: SpanFactory<ReactNativeConfiguration>, setAppState: SetAppState) {
    this.spanFactory = spanFactory as ReactNativeSpanFactory
    this.setAppState = setAppState
    this.navigationTracker = new NavigationTracker(this.spanFactory, this.setAppState)
  }

  createNavigationContainer = (Container = NavigationContainer) => {
    if (!this.navigationTracker) {
      throw new Error('Bugsnag: BugsnagPluginReactNavigationNativePerformance not configured')
    }
    return createNavigationContainer(Container, this.navigationTracker) as typeof Container
  }
}

export default BugsnagPluginReactNavigationNativePerformance
