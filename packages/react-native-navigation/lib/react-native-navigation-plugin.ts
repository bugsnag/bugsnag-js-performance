import { type InternalConfiguration, type Plugin, type SpanFactory } from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from '@bugsnag/react-native-performance'

class ReactNativeNavigationPlugin implements Plugin<ReactNativeConfiguration> {
  configure (configuration: InternalConfiguration<ReactNativeConfiguration>, spanFactory: SpanFactory<ReactNativeConfiguration>) {

  }
}

export default ReactNativeNavigationPlugin
