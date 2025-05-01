import type { Plugin, SetAppState, SpanFactory } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration, ReactNativeSpanFactory } from '@bugsnag/react-native-performance'
import { NavigationContainer } from '@react-navigation/native'
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native'
import { createNavigationContainer } from './create-navigation-container'
import { NavigationTracker } from './navigation-tracker'

type NavigationContainerRefType = NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>

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

  registerNavigationContainerRef = (navigationRef: NavigationContainerRefType) => {
    if (!this.navigationTracker) {
      throw new Error('Bugsnag: BugsnagPluginReactNavigationNativePerformance not configured')
    }

    if (!navigationRef.current) {
      return
    }

    navigationRef.current?.addListener('state', () => {
      const currentRoute = navigationRef.getCurrentRoute()
      if (this.navigationTracker && currentRoute) {
        this.navigationTracker.handleRouteChange(currentRoute.name)
        const endTime = performance.now()

        setTimeout(() => {
          this.navigationTracker?.completeNavigation(endTime, 'immediate')
        }, 100)
      }
    })
  }
}

export default BugsnagPluginReactNavigationNativePerformance
