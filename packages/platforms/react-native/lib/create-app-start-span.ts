import type { SpanFactory } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from './config'

export function createAppStartSpan (spanFactory: SpanFactory<ReactNativeConfiguration>, appStartTime: number) {
  const appStartSpan = spanFactory.startSpan('[AppStart/ReactNativeInit]', { startTime: appStartTime, parentContext: null })

  spanFactory.startSpan('[AppStart/ReactNativeInit]', { startTime: appStartTime, parentContext: null })
  appStartSpan.setAttribute('bugsnag.span.category', 'app_start')
  appStartSpan.setAttribute('bugsnag.app_start.type', 'ReactNativeInit')

  return appStartSpan
}
