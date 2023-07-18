import type { SpanAttribute, SpanAttributesSource } from '@bugsnag/core-performance'

const spanAttributesSource: SpanAttributesSource = () => {
  const spanAttributes = new Map<string, SpanAttribute>()
  spanAttributes.set('bugsnag.span.category', 'custom')

  return spanAttributes
}

export default spanAttributesSource
