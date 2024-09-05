import type { Clock, SpanFactory, SpanInternal } from '@bugsnag/core-performance'
import { useEffect } from 'react'
import type { ReactNativeConfiguration } from './config'

export const useEndSpanOnMount = (spanFactory: SpanFactory<ReactNativeConfiguration>, clock: Clock, span: SpanInternal) => {
  useEffect(() => {
    console.log('[BugsnagPerformance] useEndSpanOnMount called')
    if (span.isValid()) {
      console.log('[BugsnagPerformance] ending appStartSpan')
      spanFactory.endSpan(span, clock.now())
    } else {
      console.log('[BugsnagPerformance] span is not valid, not ending')
    }
  }, [])
}
