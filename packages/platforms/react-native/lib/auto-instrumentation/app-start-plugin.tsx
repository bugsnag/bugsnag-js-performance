import { getAppState, setAppState, SpanQuery } from '@bugsnag/core-performance'
import type { Clock, Plugin, PluginContext, SpanControlProvider } from '@bugsnag/core-performance'
import type { ReactNode } from 'react'
import React from 'react'
import type { AppRegistry, WrapperComponentProvider } from 'react-native'
import type { ReactNativeConfiguration } from '../config'
import { APP_START_BASE_NAME } from '../span-factory'
import type { ReactNativeSpanFactory } from '../span-factory'

interface WrapperProps {
  children: ReactNode
}

export const isWrapperComponentProvider = (value: unknown): value is WrapperComponentProvider | null =>
  value === null || typeof value === 'function'

export interface AppStartSpanControl {
  setType: (appStartType?: string | null) => void
  clearType: () => void
}

export class AppStartSpanQuery extends SpanQuery<AppStartSpanControl> {}

export class AppStartPlugin<C extends ReactNativeConfiguration = ReactNativeConfiguration> implements Plugin<C>, SpanControlProvider<AppStartSpanControl> {
  private readonly appStartTime: number
  private readonly spanFactory: ReactNativeSpanFactory<C>
  private readonly clock: Clock
  private readonly appRegistry: typeof AppRegistry

  private wrapperComponentProvider: WrapperComponentProvider | null = null
  private enabled: boolean = false

  constructor (
    appStartTime: number,
    spanFactory: ReactNativeSpanFactory<C>,
    clock: Clock,
    appRegistry: typeof AppRegistry
  ) {
    this.appStartTime = appStartTime
    this.spanFactory = spanFactory
    this.clock = clock
    this.appRegistry = appRegistry
  }

  install (context: PluginContext<ReactNativeConfiguration>) {
    context.addSpanControlProvider(this)

    if (!context.configuration.autoInstrumentAppStarts) return

    if (context.configuration.wrapperComponentProvider) {
      this.wrapperComponentProvider = context.configuration.wrapperComponentProvider
    }

    this.enabled = true
  }

  start () {
    if (!this.enabled) return

    this.spanFactory.startAppStartSpan(this.appStartTime)

    const AppStartWrapper = ({ children }: WrapperProps) => {
      React.useEffect(() => {
        this.spanFactory.endAppStartSpan(this.clock.now())
        if (getAppState() === 'starting') {
          setAppState('ready')
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

  getSpanControls<Q> (query: Q): AppStartSpanControl | null {
    if (query !== AppStartSpanQuery && !(query instanceof AppStartSpanQuery)) {
      return null
    }

    if (!this.spanFactory.appStartSpan?.isValid()) {
      return null
    }

    return {
      setType: (appStartType) => {
        this.setAppStartType(appStartType)
      },
      clearType: () => {
        this.setAppStartType(null)
      }
    }
  }

  private setAppStartType (name?: string | null) {
    if (!this.spanFactory.appStartSpan?.isValid()) return

    if (name === null || name === undefined) {
      this.spanFactory.appStartSpan.name = APP_START_BASE_NAME
      this.spanFactory.appStartSpan.setAttribute('bugsnag.app_start.name', null)
      return
    }

    if (typeof name !== 'string') return

    this.spanFactory.appStartSpan.name = `${APP_START_BASE_NAME}${name}`
    this.spanFactory.appStartSpan.setAttribute('bugsnag.app_start.name', name)
  }
}
