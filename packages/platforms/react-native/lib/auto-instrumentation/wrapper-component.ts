import { type Logger, type Clock, type SpanFactory } from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from '../config'
import { type PropsWithChildren, useEffect } from 'react'

const logPrefix = () => `[BugsnagPerformance] ${new Date().toISOString()} - `

export const createWrapperComponent = (appStartTime: number, spanFactory: SpanFactory<ReactNativeConfiguration>, clock: Clock, logger: Logger): React.FC<PropsWithChildren> => {
  const WrapperComponent = ({ children }: PropsWithChildren) => {
    logger.debug(`${logPrefix()}BugsnagWrapperComponent function called`)
    const span = spanFactory.startSpan('BugsnagWrapperComponent', { startTime: appStartTime })

    useEffect(() => {
      logger.debug(`${logPrefix()}BugsnagWrapperComponent useEffect`)
      spanFactory.endSpan(span, clock.now())
    }, [])

    return children
  }

  return WrapperComponent
}
