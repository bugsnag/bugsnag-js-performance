import { type SpanAttributesSource } from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from './config'
import { type AppStateStatic } from 'react-native'

export function createSpanAttributesSource (appState: AppStateStatic) {
  const spanAttributesSource: SpanAttributesSource<ReactNativeConfiguration> = {
    configure (configuration) {

    },
    requestAttributes (span) {
      span.setAttribute('bugsnag.app.in_foreground', appState.currentState === 'active')
    }
  }

  return spanAttributesSource
}
