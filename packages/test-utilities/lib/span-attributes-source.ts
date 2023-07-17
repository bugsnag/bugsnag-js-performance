import { type SpanAttribute } from '@bugsnag/core-performance'

function spanAttributesSource (): Map<string, SpanAttribute> {
  const spanAttributes = new Map()

  return spanAttributes
}

export default spanAttributesSource
