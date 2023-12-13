import type { Plugin } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance/lib/config'

class ReactNavigationNativePlugin implements Plugin<ReactNativeConfiguration> {
  configure (configuration: ReactNativeConfiguration) {

  }
}

export default ReactNavigationNativePlugin
