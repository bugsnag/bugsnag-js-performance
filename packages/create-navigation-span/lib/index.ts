import type { Configuration, SpanFactory, SpanOptions } from '@bugsnag/core-performance'

function createNavigationSpan <C extends Configuration> (spanFactory: SpanFactory<C>, routeName: string, spanOptions: SpanOptions) {
  // Navigation spans are always first class
  spanOptions.isFirstClass = true

  const spanName = '[Navigation]' + routeName
  const span = spanFactory.startSpan(spanName, spanOptions)

  // Default navigation span attributes
  span.setAttribute('bugsnag.span.category', 'navigation')
  span.setAttribute('bugsnag.navigation.route', routeName)

  return span
}

export default createNavigationSpan
