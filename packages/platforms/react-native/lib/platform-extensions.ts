import { type Clock, type SpanFactory, type SpanOptions } from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from './config'
import { createAppStartWrapperComponent } from './auto-instrumentation/app-start-wrapper-component'

type NavigationSpanOptions = Omit<SpanOptions, 'isFirstClass'>

export const platformExtensions = (spanFactory: SpanFactory<ReactNativeConfiguration>, clock: Clock) => {
  const appStartTime = clock.now()
  return {
    startNavigationSpan: (routeName: string, spanOptions?: NavigationSpanOptions) => {
      const cleanOptions = spanFactory.validateSpanOptions(routeName, spanOptions)
      cleanOptions.options.isFirstClass = true

      const span = spanFactory.startSpan(`[Navigation]${cleanOptions.name}`, cleanOptions.options)
      span.setAttribute('bugsnag.span.category', 'navigation')
      span.setAttribute('bugsnag.navigation.route', cleanOptions.name)
      return spanFactory.toPublicApi(span)
    },
    AppStartWrapperComponent: createAppStartWrapperComponent(spanFactory, clock, appStartTime)
  }
}
