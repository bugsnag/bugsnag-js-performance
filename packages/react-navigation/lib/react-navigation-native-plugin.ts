import type { Plugin } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance/lib/config'
import { createNavigationContainer } from './create-navigation-container'

class ReactNavigationNativePlugin implements Plugin<ReactNativeConfiguration> {
  configure (configuration: ReactNativeConfiguration) {}

  createNavigationContainer = createNavigationContainer
}

export default ReactNavigationNativePlugin
