import { type SpanContextStorage, type SpanFactory, type SpanOptions } from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from './config'

type NavigationSpanOptions = Omit<SpanOptions, 'isFirstClass'>

export const platformExtensions = (spanFactory: SpanFactory<ReactNativeConfiguration>, spanContextStorage: SpanContextStorage) => ({
  startNavigationSpan: (routeName: string, spanOptions?: NavigationSpanOptions) => {
    const cleanOptions = spanFactory.validateSpanOptions(routeName, spanOptions)
    cleanOptions.options.isFirstClass = true

    const span = spanFactory.startSpan(`[Navigation]${cleanOptions.name}`, cleanOptions.options)
    span.setAttribute('bugsnag.span.category', 'navigation')
    span.setAttribute('bugsnag.navigation.route', cleanOptions.name)
    return spanFactory.toPublicApi(span)
  }
})

export type PlatformExtensions = ReturnType<typeof platformExtensions>
