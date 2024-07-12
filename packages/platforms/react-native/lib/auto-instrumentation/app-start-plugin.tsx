import type {
  Clock,
  InternalConfiguration,
  Plugin,
  SpanFactory
} from '@bugsnag/core-performance'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import type { AppRegistry, WrapperComponentProvider } from 'react-native'
import type { ReactNativeConfiguration } from '../config'

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

    const AppStartWrapper = ({ children }: WrapperProps) => {
      useEffect(() => {
        if (appStartSpan.isValid()) {
          this.spanFactory.endSpan(appStartSpan, this.clock.now())
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
