import type { Client, Clock, SpanContextStorage, SpanOptions } from '@bugsnag/core-performance'
import React from 'react'
import { Platform } from 'react-native'
import NativeBugsnagPerformance from './native'
import type { ReactNativeAttachConfiguration, ReactNativeConfiguration } from './config'
import type { ReactNativeSpanFactory } from './span-factory'

type NavigationSpanOptions = Omit<SpanOptions, 'isFirstClass'>

export const platformExtensions = (appStartTime: number, clock: Clock, spanFactory: ReactNativeSpanFactory, spanContextStorage: SpanContextStorage) => ({
  startNavigationSpan: function (routeName: string, spanOptions?: NavigationSpanOptions) {
    const cleanOptions = spanFactory.validateSpanOptions(routeName, spanOptions)
    const span = spanFactory.startNavigationSpan(cleanOptions.name, cleanOptions.options)
    return spanFactory.toPublicApi(span)
  },
  withInstrumentedAppStarts: function (App: React.FC) {
    spanFactory.startAppStartSpan(appStartTime)

    return () => {
      React.useEffect(() => {
        spanFactory.endAppStartSpan(clock.now())
      }, [])

      return <App />
    }
  },
  attach: function (config?: ReactNativeAttachConfiguration) {
    const platform = Platform.OS === 'ios' ? 'Cocoa' : 'Android'
    const isNativePerformanceAvailable = NativeBugsnagPerformance?.isNativePerformanceAvailable()
    if (!isNativePerformanceAvailable) {
      throw new Error(`Could not attach to native SDK. No compatible version of Bugsnag ${platform} Performance was found.`)
    }

    const nativeConfig = NativeBugsnagPerformance?.attachToNativeSDK()
    if (!nativeConfig) {
      throw new Error(`Could not attach to native SDK. Bugsnag ${platform} Performance has not been started.`)
    }

    const finalConfig: ReactNativeConfiguration = {
      ...config,
      ...nativeConfig
    }

    spanFactory.onAttach(nativeConfig.appStartParentContext)
    const client = this as unknown as Client<ReactNativeConfiguration>
    client.start(finalConfig)
  }
})

export type PlatformExtensions = ReturnType<typeof platformExtensions>
