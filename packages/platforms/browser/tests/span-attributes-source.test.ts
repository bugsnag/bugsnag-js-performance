import { SpanInternal } from '@bugsnag/core-performance'
import { createConfiguration, createSpanAttributes, IncrementingClock } from '@bugsnag/js-performance-test-utilities'
import type { BrowserConfiguration } from '../lib'
import createSpanAttributesSource from '../lib/span-attributes-source'

const mockDocument = {
  title: 'span attributes source',
  location: {
    href: 'https://bugsnag.com/span-attributes-source'
  }
}

const spanAttributesSource = createSpanAttributesSource(mockDocument as Document)

describe('spanAttributesSource', () => {
  it('adds permitted attributes to a span', () => {
    const browserConfiguration = createConfiguration<BrowserConfiguration>({ sendPageAttributes: { url: true, title: true } })
    const spanAttributes = createSpanAttributes('test.span')
    const clock = new IncrementingClock()
    const span = new SpanInternal('id', 'traceId', 'test.span', 1234, spanAttributes, clock)

    spanAttributesSource.requestAttributes(span)

    // @ts-expect-error attributes not accessible on span
    const attributes: Map<string, any> = span.attributes.attributes

    expect(attributes.get('bugsnag.browser.page.title')).toBeUndefined()
    expect(attributes.get('bugsnag.browser.page.url')).toBeUndefined()

    spanAttributesSource.configure(browserConfiguration)
    spanAttributesSource.requestAttributes(span)

    expect(attributes.get('bugsnag.browser.page.title')).toBe('span attributes source')
    expect(attributes.get('bugsnag.browser.page.url')).toBe('https://bugsnag.com/span-attributes-source')
  })
})
