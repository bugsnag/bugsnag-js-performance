import type { SpanOptions } from '@bugsnag/core-performance'
import type { ReactNativeSpanFactory } from './span-factory'

export function createNavigationSpan (spanFactory: ReactNativeSpanFactory, routeName: string, spanOptions: SpanOptions) {
  // Navigation spans are always first class
  spanOptions.isFirstClass = true

  const spanName = '[Navigation]' + routeName
  const span = spanFactory.startSpan(spanName, spanOptions)

  // Default navigation span attributes
  span.setAttribute('bugsnag.span.category', 'navigation')
  span.setAttribute('bugsnag.navigation.route', routeName)

  return span
}
