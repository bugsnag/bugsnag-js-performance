import type { SpanContextStorage, SpanFactory, SpanOptions } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from './config'
import React, { useEffect } from 'react'

type NavigationSpanOptions = Omit<SpanOptions, 'isFirstClass'>

export const platformExtensions = (appStartTime: number, spanFactory: SpanFactory<ReactNativeConfiguration>, spanContextStorage: SpanContextStorage) => ({
  startNavigationSpan: (routeName: string, spanOptions?: NavigationSpanOptions) => {
    const cleanOptions = spanFactory.validateSpanOptions(routeName, spanOptions)
    cleanOptions.options.isFirstClass = true

    const span = spanFactory.startSpan(`[Navigation]${cleanOptions.name}`, cleanOptions.options)
    span.setAttribute('bugsnag.span.category', 'navigation')
    span.setAttribute('bugsnag.navigation.route', cleanOptions.name)
    return spanFactory.toPublicApi(span)
  },
  wrapApp: (App: React.FC) => {
    const appStartSpan = spanFactory.startSpan('[AppStart/ReactNativeInit]', { startTime: appStartTime, parentContext: null })
    appStartSpan.setAttribute('bugsnag.span.category', 'app_start')
    appStartSpan.setAttribute('bugsnag.app_start.type', 'ReactNativeInit')

    return () => {
      useEffect(() => {
        if (appStartSpan.isValid()) {
          spanFactory.endSpan(appStartSpan, performance.now())
        }
      }, [])

      return <App />
    }
  }
})

export type PlatformExtensions = ReturnType<typeof platformExtensions>
