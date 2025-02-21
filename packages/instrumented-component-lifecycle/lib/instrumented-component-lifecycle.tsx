import BugsnagPerformance from '@bugsnag/browser-performance'
import { DISCARD_END_TIME } from '@bugsnag/core-performance'
import type { Span } from '@bugsnag/core-performance'
import * as React from 'react'
import type { PropsWithChildren } from 'react'

interface InstrumentedComponentLifecycleProps extends PropsWithChildren {
  name: string
  includeComponentUpdates: boolean
  componentProps: Record<string, unknown>
}

class InstrumentedComponentLifecycle extends React.Component<InstrumentedComponentLifecycleProps> {
  private componentMountSpan: Span | undefined
  private componentUpdateSpan: Span | undefined
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

  public shouldComponentUpdate ({ includeComponentUpdates = true, componentProps }: InstrumentedComponentLifecycleProps): boolean {
    if (includeComponentUpdates && this.componentMountSpan && componentProps !== this.props.componentProps) {
      this.componentUpdateSpan = BugsnagPerformance.startSpan(`[ViewLoadPhase/Update]${this.props.name}`)
      const updatedProps = Object.keys(componentProps).filter(prop => componentProps[prop] !== this.props.componentProps[prop])
      this.componentUpdateSpan.setAttribute('bugsnag.component.update.props', updatedProps)
    }
    return true
  }

  public componentDidUpdate () {
    if (this.componentUpdateSpan && BugsnagPerformance.appState === 'ready') {
      this.componentUpdateSpan.end()
    }
  }

  public componentWillUnmount () {
    if (BugsnagPerformance.appState !== 'ready') {
      BugsnagPerformance.startSpan(`[ViewLoadPhase/Unmount]${this.props.name}`).end()
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
) {
  const componentDisplayName = (options && options.name) || Component.displayName || Component.name || 'unknown'

  const WrappedComponent = (props: P) => (
    <InstrumentedComponentLifecycle {...options} name={componentDisplayName} componentProps={props}>
      <Component {...props} />
    </InstrumentedComponentLifecycle>
  )

  return WrappedComponent
}
