import type { SpanInternal } from '@bugsnag/core-performance'
import type { ReactNativeSpanFactory } from './span-factory'

let appStartSpan: SpanInternal

export function createAppStartSpan (spanFactory: ReactNativeSpanFactory, appStartTime: number) {
  if (appStartSpan) {
    return appStartSpan
  }

  appStartSpan = spanFactory.startSpan('[AppStart/ReactNativeInit]', { startTime: appStartTime, parentContext: null })
  appStartSpan.setAttribute('bugsnag.span.category', 'app_start')
  appStartSpan.setAttribute('bugsnag.app_start.type', 'ReactNativeInit')

  return appStartSpan
}
