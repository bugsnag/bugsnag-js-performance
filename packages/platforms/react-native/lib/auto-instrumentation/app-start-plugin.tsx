import { getAppState, setAppState } from '@bugsnag/core-performance'
import type { Clock, Plugin, PluginContext } from '@bugsnag/core-performance'
import type { ReactNode } from 'react'
import React from 'react'
import type { AppRegistry, WrapperComponentProvider } from 'react-native'
import type { ReactNativeConfiguration } from '../config'
import type { ReactNativeSpanFactory } from '../span-factory'

interface WrapperProps {
  children: ReactNode
}

export const isWrapperComponentProvider = (value: unknown): value is WrapperComponentProvider | null =>
  value === null || typeof value === 'function'

export class AppStartPlugin implements Plugin<ReactNativeConfiguration> {
  private readonly appStartTime: number
  private readonly spanFactory: ReactNativeSpanFactory
  private readonly clock: Clock
  private readonly appRegistry: typeof AppRegistry

  private wrapperComponentProvider: WrapperComponentProvider | null = null
  private enabled: boolean = false

  constructor (
    appStartTime: number,
    spanFactory: ReactNativeSpanFactory,
    clock: Clock,
    appRegistry: typeof AppRegistry
  ) {
    this.appStartTime = appStartTime
    this.spanFactory = spanFactory
    this.clock = clock
    this.appRegistry = appRegistry
  }

  install (context: PluginContext<ReactNativeConfiguration>) {
    if (!context.configuration.autoInstrumentAppStarts) return

    if (context.configuration.wrapperComponentProvider) {
      this.wrapperComponentProvider = context.configuration.wrapperComponentProvider
    }

    this.enabled = true
  }

  start () {
    if (!this.enabled) return

    const appStartSpan = this.spanFactory.startAppStartSpan(this.appStartTime)

    const AppStartWrapper = ({ children }: WrapperProps) => {
      React.useEffect(() => {
        if (appStartSpan.isValid()) {
          this.spanFactory.endSpan(appStartSpan, this.clock.now())
          if (getAppState() === 'starting') {
            setAppState('ready')
          }
        }
      }, [])

      return children
    }

    const instrumentedComponentProvider: WrapperComponentProvider = (appParams) => ({ children }) => {
      if (this.wrapperComponentProvider) {
        const WrapperComponent = this.wrapperComponentProvider(appParams)

        return (
          <AppStartWrapper>
            <WrapperComponent>{children}</WrapperComponent>
          </AppStartWrapper>
        )
      }

      return <AppStartWrapper>{children}</AppStartWrapper>
    }

    this.appRegistry.setWrapperComponentProvider(instrumentedComponentProvider)
  }
}
