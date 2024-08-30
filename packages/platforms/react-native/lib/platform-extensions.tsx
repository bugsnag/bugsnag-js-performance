import type { Clock, SpanContextStorage, SpanFactory, SpanOptions } from '@bugsnag/core-performance'
import React from 'react'
import type { ReactNativeConfiguration } from './config'
import { createAppStartSpan } from './create-app-start-span'
import { useEndSpanOnMount } from './use-end-span-on-mount'

type NavigationSpanOptions = Omit<SpanOptions, 'isFirstClass'>

export const platformExtensions = (appStartTime: number, clock: Clock, spanFactory: SpanFactory<ReactNativeConfiguration>, spanContextStorage: SpanContextStorage) => ({
  startNavigationSpan: (routeName: string, spanOptions?: NavigationSpanOptions) => {
    const cleanOptions = spanFactory.validateSpanOptions(routeName, spanOptions)
    cleanOptions.options.isFirstClass = true

    const span = spanFactory.startSpan(`[Navigation]${cleanOptions.name}`, cleanOptions.options)
    span.setAttribute('bugsnag.span.category', 'navigation')
    span.setAttribute('bugsnag.navigation.route', cleanOptions.name)
    return spanFactory.toPublicApi(span)
  },
  withInstrumentedAppStarts: (App: React.FC) => {
    const appStartSpan = createAppStartSpan(spanFactory, appStartTime)

    return () => {
      useEndSpanOnMount(appStartSpan, spanFactory, clock)

      return <App />
    }
  }
})

export type PlatformExtensions = ReturnType<typeof platformExtensions>
