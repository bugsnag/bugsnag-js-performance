import type { Clock, SpanFactory, SpanInternal } from '@bugsnag/core-performance'
import { useEffect } from 'react'
import type { ReactNativeConfiguration } from './config'

export const useEndSpanOnMount = (spanFactory: SpanFactory<ReactNativeConfiguration>, clock: Clock, span: SpanInternal) => {
  useEffect(() => {
    if (span.isValid()) {
      spanFactory.endSpan(span, clock.now())
    }
  }, [])
}
