import type { Logger } from '@bugsnag/core-performance'
import { SpanAttributes } from '@bugsnag/core-performance'

const createSpanAttributes = (spanName: string, logger: Logger = console) => {
  return new SpanAttributes(new Map(), {
    attributeStringValueLimit: 1024,
    attributeArrayLengthLimit: 128,
    attributeCountLimit: 128
  }, spanName, logger)
}

export default createSpanAttributes
