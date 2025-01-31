import type { Clock, SetAppState, SpanFactory, SpanInternal } from '@bugsnag/core-performance'
import { BrowserConfiguration } from '@bugsnag/browser-performance'
import React, { PropsWithChildren, ReactNode } from 'react'

interface InstrumentedComponentLifecycleProps extends PropsWithChildren {
  name: string;
  includeComponentUpdates: boolean;
  children: ReactNode;
  updateProps: { [key: string]: unknown };
  spanFactory: SpanFactory<BrowserConfiguration>;
  setAppState: SetAppState;
}

class InstrumentedComponentLifecycle extends React.Component<InstrumentedComponentLifecycleProps> {
  private componentMountSpan: SpanInternal
  private componentUpdateSpan: SpanInternal | undefined
  private readonly spanFactory: SpanFactory<BrowserConfiguration>
  private readonly clock: Clock

  public static defaultProps: Partial<InstrumentedComponentLifecycleProps> = {
    includeComponentUpdates: true,
  }

  public constructor(props: InstrumentedComponentLifecycleProps, spanFactory: SpanFactory<BrowserConfiguration>, clock: Clock) {
    super(props)
    const { name } = this.props

    this.componentMountSpan = this.props.spanFactory.startSpan(`${name} component mount span`, { startTime: 0 })

    this.spanFactory = spanFactory
    this.clock = clock
  }

  async componentDidMount() {
    if (this.componentMountSpan) {
      this.spanFactory.endSpan(this.componentMountSpan, this.clock.now())
    }
  }

  public shouldComponentUpdate({ updateProps, includeComponentUpdates = true }: InstrumentedComponentLifecycleProps): boolean {
    if (includeComponentUpdates && this.componentMountSpan && updateProps !== this.props.updateProps) {
      this.componentUpdateSpan = this.spanFactory.startSpan(`${this.props.name} component update span`, { startTime: 0 })
    }
    return true
  }

  public componentDidUpdate() {
    if (this.componentUpdateSpan) {
      this.spanFactory.endSpan(this.componentUpdateSpan, this.clock.now())
    }
  }

  public render(): React.ReactNode {
    return this.props.children
  }
}

function withInstrumentedComponentLifecycle<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  options?: Pick<Partial<InstrumentedComponentLifecycleProps>,Exclude<keyof InstrumentedComponentLifecycleProps, "updateProps" | "children">>
): React.FC<P> {
  const componentDisplayName = (options && options.name) || Component.displayName || Component.name || 'unknown'

    const Wrapped: React.FC<P> = (props: P) => (
      <InstrumentedComponentLifecycle {...options} name={componentDisplayName}>
        <Component {...props} />
      </InstrumentedComponentLifecycle>
    )

  Wrapped.displayName = `instrumented-lifecycle-(${componentDisplayName})`

  return Wrapped;
}
