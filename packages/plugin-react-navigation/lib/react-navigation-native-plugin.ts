import type { Plugin, PluginContext } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import type { NavigationContainerOrRef } from './navigation-tracker'
import { NavigationContainer } from '@react-navigation/native'
import { createNavigationContainer } from './create-navigation-container'
import { NavigationTracker } from './navigation-tracker'

class BugsnagPluginReactNavigationNativePerformance implements Plugin<ReactNativeConfiguration> {
  private navigationTracker?: NavigationTracker

  install (_context: PluginContext<ReactNativeConfiguration>) {
    this.navigationTracker = new NavigationTracker()
  }

  start () {}

  createNavigationContainer = (Container = NavigationContainer) => {
    if (!this.navigationTracker) {
      throw new Error('Bugsnag: BugsnagPluginReactNavigationNativePerformance not configured')
    }
    return createNavigationContainer(Container, this.navigationTracker) as typeof Container
  }

  registerNavigationContainerRef = (navigationContainerRef: NavigationContainerOrRef) => {
    if (!this.navigationTracker) {
      throw new Error('Bugsnag: BugsnagPluginReactNavigationNativePerformance not configured')
    }

    this.navigationTracker.configure(navigationContainerRef)
  }

  blockNavigationEnd () {
    this.navigationTracker?.blockNavigationEnd()
  }

  unblockNavigationEnd (endedBy: 'immediate' | 'mount' | 'unmount' | 'condition') {
    this.navigationTracker?.unblockNavigationEnd(endedBy)
  }
}

export default BugsnagPluginReactNavigationNativePerformance
