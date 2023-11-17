import {
  type InternalConfiguration,
  type Plugin,
  type SpanFactory,
  type Clock
} from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from '../config'
import React, { type ReactNode, type PropsWithChildren, useEffect, useState, useRef } from 'react'
import { type WrapperComponentProvider, type AppRegistry } from 'react-native'

type DiagnosticWrapperProps = PropsWithChildren<{
  spanFactory: SpanFactory<ReactNativeConfiguration>,
  clock: Clock,
  logger: ReactNativeConfiguration["logger"]
}>

export const isWrapperComponentProvider = (value: unknown): value is WrapperComponentProvider | null => 
  value === null || typeof value === 'function'

const logPrefix = () => `[BugsnagPerformance] ${new Date().toISOString()} - `

class DiagnosticWrapper extends React.Component<DiagnosticWrapperProps> {
  private readonly span: ReturnType<SpanFactory<ReactNativeConfiguration>['startSpan']>

  constructor (props: DiagnosticWrapperProps) {
    super(props)
    props.logger?.debug(`${logPrefix()}DiagnosticWrapper (CC) constructor`)
    this.span = props.spanFactory.startSpan('DiagnosticWrapper (CC) rendered', { startTime: props.clock.now() })
  }

  componentDidMount(): void {
    this.props.logger?.debug(`${logPrefix()}DiagnosticWrapper (CC) componentDidMount`)
    if (this.span) {
      this.props.spanFactory.endSpan(this.span, this.props.clock.now())
    }
  }

  render () {
    return this.props.children
  }
}

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

    const clientStartedSpan = this.spanFactory.startSpan('BugSnag client started', { startTime: this.clock.now(), parentContext: appStartSpan })

    const AppStartWrapper = ({ children }: PropsWithChildren) => {
      configuration.logger.debug(`${logPrefix()}AppStartWrapper (FC) called`)
      const [appStarted, setAppStarted] = useState(false)
      const wrapperComponentSpan = useRef<any>(null)
      
      if (!appStarted) {
        wrapperComponentSpan.current = this.spanFactory.startSpan('AppStartWrapper (FC) rendered', { startTime: this.clock.now(), parentContext: appStartSpan })
      }

      useEffect(() => {
        configuration.logger.debug(`${logPrefix()}AppStartWrapper (FC) useEffect`)
        setAppStarted(true)
        this.spanFactory.endSpan(wrapperComponentSpan.current, this.clock.now())
        this.spanFactory.endSpan(appStartSpan, this.clock.now())
      }, [])

      return <>{children}</>
    }

    const diagnosticWrapperProps = {
      spanFactory: this.spanFactory,
      clock: this.clock,
      logger: configuration.logger
    }

    const instrumentedComponentProvider: WrapperComponentProvider = (appParams) => ({ children }) => {
      configuration.logger.debug(`${logPrefix()}instrumentedComponentProvider called. ${configuration.wrapperComponentProvider ? 'config.wrapperComponentProvider exists' : 'config.wrapperComponentProvider does not exist'}`)
      if (configuration.wrapperComponentProvider) {
        const OriginalWrapper = configuration.wrapperComponentProvider(appParams)

        return (
          <AppStartWrapper>
            <DiagnosticWrapper {...diagnosticWrapperProps}>
              <OriginalWrapper>{children}</OriginalWrapper>
            </DiagnosticWrapper>  
          </AppStartWrapper>
        )
      }


      return <AppStartWrapper>
              <DiagnosticWrapper {...diagnosticWrapperProps}>{children}</DiagnosticWrapper>
            </AppStartWrapper>
    }

    this.spanFactory.endSpan(clientStartedSpan, this.clock.now())
    configuration.logger.debug(`${logPrefix()}Calling setWrapperComponentProvider...`)
    this.appRegistry.setWrapperComponentProvider(instrumentedComponentProvider)

    // monkey patch setWrapperComponentProvider to ensure that subsequent calls do not overwrite our instrumentation
    const originalSetWrapperComponentProvider = this.appRegistry.setWrapperComponentProvider
    this.appRegistry.setWrapperComponentProvider = (provider) => {
      configuration.logger.debug(`${logPrefix()}setWrapperComponentProvider called by something other than Bugsnag`)
      const span = this.spanFactory.startSpan('AppRegistry.setWrapperComponentProvider called', { startTime: this.clock.now() })
      this.spanFactory.endSpan(span, this.clock.now())

      const patchedComponentProvider: WrapperComponentProvider = (appParams) => ({ children }) => {
        configuration.logger.debug(`${logPrefix()}patchedComponentProvider called`)
        const OriginalProviderComponent = provider(appParams)

        return (
          <AppStartWrapper>
            <OriginalProviderComponent>
              {children}
            </OriginalProviderComponent>
          </AppStartWrapper>
        );
      }

      originalSetWrapperComponentProvider(patchedComponentProvider);
    }
  }
}
