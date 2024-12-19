import type { Client, Clock, SpanContextStorage, SpanOptions } from '@bugsnag/core-performance'
import React from 'react'
import { Platform } from 'react-native'
import type { ReactNativeAttachConfiguration, ReactNativeConfiguration, ReactNativeSchema } from './config'
import { createAppStartSpan } from './create-app-start-span'
import { createNavigationSpan } from './create-navigation-span'
import type { ReactNativeSpanFactory } from './span-factory'
import type { NativeSettings } from './NativeBugsnagPerformance'

type NavigationSpanOptions = Omit<SpanOptions, 'isFirstClass'>

export const platformExtensions = (appStartTime: number, clock: Clock, schema: ReactNativeSchema, spanFactory: ReactNativeSpanFactory, spanContextStorage: SpanContextStorage, nativeSettings?: NativeSettings) => ({
  startNavigationSpan: function (routeName: string, spanOptions?: NavigationSpanOptions) {
    const cleanOptions = spanFactory.validateSpanOptions(routeName, spanOptions)
    cleanOptions.options.isFirstClass = true
    const span = createNavigationSpan(spanFactory, cleanOptions.name, cleanOptions.options)
    return spanFactory.toPublicApi(span)
  },
  withInstrumentedAppStarts: function (App: React.FC) {
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
  attach: function (config?: ReactNativeAttachConfiguration) {
    const logger = schema.logger.validate(config?.logger) ? config.logger : schema.logger.defaultValue
    const platform = Platform.OS ? 'Cocoa' : 'Android'
    if (!nativeSettings || !nativeSettings.isNativePerformanceAvailable) {
      logger.warn(`Could not attach to native SDK. No compatible version of Bugsnag ${platform} Performance was found.`)
      return
    }

    if (!nativeSettings || !nativeSettings.configuration) {
      logger.warn(`Could not attach to native SDK. Bugsnag ${platform} Performance has not been started.`)
      return
    }

    const finalConfig: ReactNativeConfiguration = {
      ...config,
      ...nativeSettings.configuration
    }

    spanFactory.attach(nativeSettings)
    const client = this as unknown as Client<ReactNativeConfiguration>
    client.start(finalConfig)
  }
})

export type PlatformExtensions = ReturnType<typeof platformExtensions>
