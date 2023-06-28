import type { SpanAttribute, SpanAttributesSource } from '@bugsnag/core-performance'

const createSpanAttributesSource = (title: string, url: string): SpanAttributesSource => {
  return () => {
    const spanAttributes = new Map<string, SpanAttribute>()
    spanAttributes.set('bugsnag.span.category', 'custom')
    spanAttributes.set('bugsnag.browser.page.url', url)
    spanAttributes.set('bugsnag.browser.page.title', title)

    return spanAttributes
  }
}

export default createSpanAttributesSource
