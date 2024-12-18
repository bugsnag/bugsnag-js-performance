import type { Clock, SpanContextStorage, SpanOptions } from '@bugsnag/core-performance'
import React from 'react'
import type { ReactNativeAttachConfiguration } from './config'
import { createAppStartSpan } from './create-app-start-span'
import { createNavigationSpan } from './create-navigation-span'
import type { ReactNativeSpanFactory } from './span-factory'

type NavigationSpanOptions = Omit<SpanOptions, 'isFirstClass'>

export const platformExtensions = (appStartTime: number, clock: Clock, spanFactory: ReactNativeSpanFactory, spanContextStorage: SpanContextStorage) => ({
  startNavigationSpan: (routeName: string, spanOptions?: NavigationSpanOptions) => {
    const cleanOptions = spanFactory.validateSpanOptions(routeName, spanOptions)
    cleanOptions.options.isFirstClass = true
    const span = createNavigationSpan(spanFactory, cleanOptions.name, cleanOptions.options)
    return spanFactory.toPublicApi(span)
  },
  withInstrumentedAppStarts: (App: React.FC) => {
    const appStartSpan = createAppStartSpan(spanFactory, appStartTime)

    return () => {
      React.useEffect(() => {
        if (appStartSpan.isValid()) {
          spanFactory.endSpan(appStartSpan, clock.now())
        }
      }, [])

      return <App />
    }
  },
  attach: (config?: ReactNativeAttachConfiguration) => {
    // this noop implementation is overridden by the client and is just defined here for correct typing
  }
})

export type PlatformExtensions = ReturnType<typeof platformExtensions>
