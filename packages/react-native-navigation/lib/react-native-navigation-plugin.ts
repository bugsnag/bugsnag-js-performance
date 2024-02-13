import { type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import { type NavigationDelegate } from 'react-native-navigation/lib/dist/src/NavigationDelegate'

class ReactNativeNavigationPlugin implements Plugin<ReactNativeConfiguration> {
  constructor (private Navigation: NavigationDelegate) {}

  configure (configuration: InternalConfiguration<ReactNativeConfiguration>, spanFactory: SpanFactory<ReactNativeConfiguration>) {
    // TODO: Set up navigation listeners
  }
}

export default ReactNativeNavigationPlugin
