import type { Plugin, SpanFactory } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance/lib/config'
import { createNavigationContainer } from './create-navigation-container'
import { NavigationContainer } from '@react-navigation/native'

class ReactNavigationNativePlugin implements Plugin<ReactNativeConfiguration> {
  private spanFactory?: SpanFactory<ReactNativeConfiguration>

  configure (_configuration: ReactNativeConfiguration, spanFactory: SpanFactory<ReactNativeConfiguration>) {
    this.spanFactory = spanFactory
  }

  createNavigationContainer = () => {
    if (!this.spanFactory) throw new Error('Bugsnag: ReactNavigationNativePlugin not configured')
    createNavigationContainer(NavigationContainer, this.spanFactory)
  }
}

export default ReactNavigationNativePlugin
