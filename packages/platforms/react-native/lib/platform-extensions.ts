import { type Logger, type Clock, type SpanFactory, type SpanOptions } from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from './config'
import { createWrapperComponent } from './auto-instrumentation/wrapper-component'

type NavigationSpanOptions = Omit<SpanOptions, 'isFirstClass'>

export const createPlatformExtensions = (appStartTime: number) => {
  return (spanFactory: SpanFactory<ReactNativeConfiguration>, clock: Clock, logger: Logger) => {
    return {
      startNavigationSpan: (routeName: string, spanOptions?: NavigationSpanOptions) => {
        const cleanOptions = spanFactory.validateSpanOptions(routeName, spanOptions)
        cleanOptions.options.isFirstClass = true

        const span = spanFactory.startSpan(`[Navigation]${cleanOptions.name}`, cleanOptions.options)
        span.setAttribute('bugsnag.span.category', 'navigation')
        span.setAttribute('bugsnag.navigation.route', cleanOptions.name)
        return spanFactory.toPublicApi(span)
      },
      WrapperComponent: createWrapperComponent(appStartTime, spanFactory, clock, logger)
    }
  }
}
