import BugsnagPerformance from '@bugsnag/browser-performance'
import { DISCARD_END_TIME } from '@bugsnag/core-performance'
import type { Span } from '@bugsnag/core-performance'
import React from 'react'
import type { PropsWithChildren } from 'react'

interface InstrumentedComponentLifecycleProps extends PropsWithChildren {
  name: string
  includeComponentUpdates: boolean
}

class InstrumentedComponentLifecycle extends React.Component<InstrumentedComponentLifecycleProps> {
  private componentMountSpan: Span | undefined
  private componentUpdateSpan: Span | undefined
  private componentUnmountSpan: Span | undefined
  private componentLifetimeSpan: Span | undefined

  public static defaultProps: Partial<InstrumentedComponentLifecycleProps> = {
    includeComponentUpdates: true
  }

  public constructor (props: InstrumentedComponentLifecycleProps) {
    super(props)
    const { name } = this.props

    this.componentLifetimeSpan = BugsnagPerformance.appState !== 'ready' ? BugsnagPerformance.startSpan(`[ViewLoad/Component]${name}`) : undefined
    this.componentMountSpan = BugsnagPerformance.appState !== 'ready' ? BugsnagPerformance.startSpan(`[ViewLoadPhase/Mount]${name}`) : undefined
  }

  async componentDidMount () {
    if (this.componentMountSpan && BugsnagPerformance.appState === 'ready') {
      this.componentMountSpan.end()
    }
  }

  public shouldComponentUpdate ({ includeComponentUpdates = true }: InstrumentedComponentLifecycleProps, nextProps: any): boolean {
    if (includeComponentUpdates && this.componentMountSpan && nextProps !== this.props.children) {
      this.componentUpdateSpan = BugsnagPerformance.startSpan(`[ViewLoadPhase/Update]${this.props.name}`)
    }
    return true
  }

  public componentDidUpdate () {
    if (this.componentUpdateSpan && BugsnagPerformance.appState === 'ready') {
      this.componentUpdateSpan.end()
    }
  }

  public componentWillUnmount () {
    this.componentUnmountSpan = BugsnagPerformance.appState !== 'ready' ? BugsnagPerformance.startSpan(`[ViewLoadPhase/Component]${this.props.name}`) : undefined
    if (this.componentUnmountSpan) {
      this.componentUnmountSpan.end()
    }
    if (this.componentLifetimeSpan) {
      const endTime = BugsnagPerformance.appState === 'ready' ? DISCARD_END_TIME : undefined
      this.componentLifetimeSpan.end(endTime)
    }
  }

  public render (): React.ReactNode {
    return this.props.children
  }
}

export function withInstrumentedComponentLifecycle<P extends Record<string, any>> (
  Component: React.ComponentType<P>,
  options?: Partial<InstrumentedComponentLifecycleProps>
): React.FC<P> {
  const componentDisplayName = (options && options.name) || Component.displayName || Component.name || 'unknown'

  const WrappedComponent: React.FC<P> = (props: P) => (
    <InstrumentedComponentLifecycle {...options} name={componentDisplayName}>
      <Component {...props} />
    </InstrumentedComponentLifecycle>
  )

  return WrappedComponent
}
