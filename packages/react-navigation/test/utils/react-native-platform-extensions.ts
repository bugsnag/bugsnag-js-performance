import { type SpanContextStorage, type SpanFactory } from '@bugsnag/core-performance'
import { type PlatformExtensions, type ReactNativeConfiguration } from '@bugsnag/react-native-performance'

const platformExtensions = (spanFactory: SpanFactory<ReactNativeConfiguration>, spanContextStorage: SpanContextStorage): PlatformExtensions => ({
  startNavigationSpan: jest.fn((routeName, spanOptions) => {
    const cleanOptions = spanFactory.validateSpanOptions(routeName, spanOptions)
    cleanOptions.options.isFirstClass = true

    const span = spanFactory.startSpan(`[Navigation]${cleanOptions.name}`, cleanOptions.options)
    span.setAttribute('bugsnag.span.category', 'navigation')
    span.setAttribute('bugsnag.navigation.route', cleanOptions.name)

    jest.spyOn(span, 'end')
    return spanFactory.toPublicApi(span)
  })
})

export default platformExtensions
