import { type Clock, type SpanFactory } from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from '../config'
import React, { PropsWithChildren, useEffect } from "react";

export const createAppStartWrapperComponent = (spanFactory: SpanFactory<ReactNativeConfiguration>, clock: Clock, appStartTime: number): React.FC<PropsWithChildren> => {
  const AppStartWrapperComponent = ({ children }: PropsWithChildren) => {
    const appStartSpan = spanFactory.startSpan('[AppStart/ReactNativeInit]', { startTime: appStartTime, parentContext: null })
    appStartSpan.setAttribute('bugsnag.span.category', 'app_start')
    appStartSpan.setAttribute('bugsnag.app_start.type', 'ReactNativeInit')

    useEffect(() => {
      spanFactory.endSpan(appStartSpan, clock.now())
    }, [])

    return <>{children}</>
  }

  return AppStartWrapperComponent
}