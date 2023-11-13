import { type Clock, type SpanFactory } from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from '../config'
import { type PropsWithChildren, useEffect } from 'react'

export const createWrapperComponent = (spanFactory: SpanFactory<ReactNativeConfiguration>, clock: Clock): React.FC<PropsWithChildren> => {
  const WrapperComponent = ({ children }: PropsWithChildren) => {
    const span = spanFactory.startSpan('BugsnagWrapperComponent', { startTime: clock.now() })

    useEffect(() => {
      spanFactory.endSpan(span, clock.now())
    }, [])

    return children
  }

  return WrapperComponent
}
