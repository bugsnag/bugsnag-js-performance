import type { Logger } from '@bugsnag/core-performance'
import { SpanAttributes } from '@bugsnag/core-performance'

const createSpanAttributes = (logger: Logger = console) => {
  return new SpanAttributes(new Map(), {
    attributeStringValueLimit: 1024,
    attributeArrayLengthLimit: 128,
    attributeCountLimit: 128
  }, logger)
}

export default createSpanAttributes
