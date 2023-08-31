import {
  type InternalConfiguration,
  type Plugin,
  type SpanFactory,
  type Clock
} from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from '../config'
import {type ReactNode, useEffect } from 'react'
import { type WrapperComponentProvider, type AppRegistry } from 'react-native'

type WrapperProps = {
  children: ReactNode
}

export const isWrapperComponentProvider = (value: unknown): value is WrapperComponentProvider | null => 
  value === null || typeof value === 'function'

export class AppStartPlugin implements Plugin<ReactNativeConfiguration> {
  private readonly appStartTime: number
  private readonly spanFactory: SpanFactory<ReactNativeConfiguration>
  private readonly clock: Clock
  private readonly appRegistry: typeof AppRegistry

  constructor (
    appStartTime: number,
    spanFactory: SpanFactory<ReactNativeConfiguration>,
    clock: Clock,
    appRegistry: typeof AppRegistry
  ) {
    this.appStartTime = appStartTime
    this.spanFactory = spanFactory
    this.clock = clock
    this.appRegistry = appRegistry
  }

  configure (configuration: InternalConfiguration<ReactNativeConfiguration>) {
    if (!configuration.autoInstrumentAppStarts) return

    const appStartSpan = this.spanFactory.startSpan('[AppStart/ReactNativeInit]', { startTime: this.appStartTime, parentContext: null })
    appStartSpan.setAttribute('bugsnag.span.category', 'app_start')
    appStartSpan.setAttribute('bugsnag.app_start.type', 'ReactNativeInit')

    const Wrapper = ({children}: WrapperProps) => {
      useEffect(() => {
        this.spanFactory.endSpan(appStartSpan, this.clock.now())
      }, [])
      return (<>{children}</>)
    }

    const instrumentedComponentProvider: WrapperComponentProvider = () => ({ children }) => {
      return (<Wrapper>{children}</Wrapper>)
    }

    this.appRegistry.setWrapperComponentProvider(instrumentedComponentProvider)
  }
}
