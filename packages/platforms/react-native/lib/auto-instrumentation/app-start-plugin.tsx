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
  clock: Clock
}>

export const isWrapperComponentProvider = (value: unknown): value is WrapperComponentProvider | null => 
  value === null || typeof value === 'function'

class DiagnosticWrapper extends React.Component<DiagnosticWrapperProps> {
  private readonly span: ReturnType<SpanFactory<ReactNativeConfiguration>['startSpan']>

  constructor (props: DiagnosticWrapperProps) {
    super(props)
    this.span = props.spanFactory.startSpan('DiagnosticWrapper (CC) rendered', { startTime: props.clock.now() })
  }

  componentDidMount(): void {
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
      const [appStarted, setAppStarted] = useState(false)
      const wrapperComponentSpan = useRef<any>(null)
      
      if (!appStarted) {
        wrapperComponentSpan.current = this.spanFactory.startSpan('AppStartWrapper (FC) rendered', { startTime: this.clock.now(), parentContext: appStartSpan })
      }

      useEffect(() => {
        setAppStarted(true)
        this.spanFactory.endSpan(wrapperComponentSpan.current, this.clock.now())
        this.spanFactory.endSpan(appStartSpan, this.clock.now())
      }, [])

      return <>{children}</>
    }

    const diagnosticWrapperProps = {
      spanFactory: this.spanFactory,
      clock: this.clock
    }

    const instrumentedComponentProvider: WrapperComponentProvider = (appParams) => ({ children }) => {
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
    this.appRegistry.setWrapperComponentProvider(instrumentedComponentProvider)
  }
}
