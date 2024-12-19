import type {
  Clock,
  InternalConfiguration,
  Plugin,
  SpanFactory
} from '@bugsnag/core-performance'
import type { ReactNode } from 'react'
import React from 'react'
import type { AppRegistry, WrapperComponentProvider } from 'react-native'
import type { ReactNativeConfiguration } from '../config'
import { createAppStartSpan } from '../create-app-start-span'
import type { AppState } from '../../../../core/lib/core'

interface WrapperProps {
  children: ReactNode
}

export const isWrapperComponentProvider = (value: unknown): value is WrapperComponentProvider | null =>
  value === null || typeof value === 'function'

export class AppStartPlugin implements Plugin<ReactNativeConfiguration> {
  private readonly appStartTime: number
  private readonly spanFactory: SpanFactory<ReactNativeConfiguration>
  private readonly clock: Clock
  private readonly appRegistry: typeof AppRegistry
  private readonly setAppState: (appState: AppState) => void

  constructor (
    appStartTime: number,
    spanFactory: SpanFactory<ReactNativeConfiguration>,
    clock: Clock,
    appRegistry: typeof AppRegistry,
    setAppState: (appState: AppState) => void
  ) {
    this.appStartTime = appStartTime
    this.spanFactory = spanFactory
    this.clock = clock
    this.appRegistry = appRegistry
    this.setAppState = setAppState
  }

  configure (configuration: InternalConfiguration<ReactNativeConfiguration>) {
    if (!configuration.autoInstrumentAppStarts) return

    const appStartSpan = createAppStartSpan(this.spanFactory, this.appStartTime)

    const AppStartWrapper = ({ children }: WrapperProps) => {
      React.useEffect(() => {
        if (appStartSpan.isValid()) {
          this.spanFactory.endSpan(appStartSpan, this.clock.now())
          this.setAppState('ready')
        }
      }, [])

      return children
    }

    const instrumentedComponentProvider: WrapperComponentProvider = (appParams) => ({ children }) => {
      if (configuration.wrapperComponentProvider) {
        const WrapperComponent = configuration.wrapperComponentProvider(appParams)

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
