import {
  type InternalConfiguration,
  type Plugin,
  type SpanFactory,
  type Clock
} from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from '../config'
import React, { useEffect } from 'react'
import { type WrapperComponentProvider, type AppRegistry } from 'react-native'

export class AppStartPlugin implements Plugin<ReactNativeConfiguration> {
  private readonly spanFactory: SpanFactory<ReactNativeConfiguration>
  private readonly clock: Clock
  private readonly startTime: number
  private readonly appRegistry: typeof AppRegistry

  constructor (
    spanFactory: SpanFactory<ReactNativeConfiguration>,
    clock: Clock,
    appRegistry: typeof AppRegistry
  ) {
    this.spanFactory = spanFactory
    this.clock = clock
    this.startTime = clock.now()
    this.appRegistry = appRegistry
  }

  configure (configuration: InternalConfiguration<ReactNativeConfiguration>) {
    if (!configuration.autoInstrumentAppStarts) return

    const appStartSpan = this.spanFactory.startSpan('[AppStart/ReactNativeInit]', { startTime: this.startTime, parentContext: null })
    appStartSpan.setAttribute('bugsnag.span.category', 'app_start')
    appStartSpan.setAttribute('bugsnag.app_start.type', 'ReactNativeInit')

    const instrumentedComponentProvider: WrapperComponentProvider = (appProps) => {
      const endSpan = () => {
        this.spanFactory.endSpan(appStartSpan, this.clock.now())
      }

      return ({children}) => {
        useEffect(() => {
          endSpan()
        }, [])

        return <React.Fragment>{children}</React.Fragment>
      }
    }

    this.appRegistry.setWrapperComponentProvider(instrumentedComponentProvider)
  }
}
