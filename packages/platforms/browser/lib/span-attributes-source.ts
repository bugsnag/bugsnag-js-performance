import type { SpanAttribute, SpanAttributesSource } from '@bugsnag/js-performance-core'

const spanAttributesSource: SpanAttributesSource = () => {
  const spanAttributes = new Map<string, SpanAttribute>()
  spanAttributes.set('browser.page.url', window.location.href)
  return spanAttributes
}

export default spanAttributesSource
