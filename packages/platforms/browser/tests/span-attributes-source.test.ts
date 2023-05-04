/**
 * @jest-environment jsdom
 */

import createSpanAttributesSource from '../lib/span-attributes-source'

describe('spanAttributesSource', () => {
  it('includes common span attributes', () => {
    const spanAttributesSource = createSpanAttributesSource(
      'the page title',
      'https://www.bugsnag.com'
    )
    const spanAttributes = spanAttributesSource()
    expect(spanAttributes.get('bugsnag.span.category')).toBe('custom')
    expect(spanAttributes.get('bugsnag.span.first_class')).toBe(true)
    expect(spanAttributes.get('bugsnag.browser.page.title')).toBe('the page title')
    expect(spanAttributes.get('bugsnag.browser.page.url')).toBe('https://www.bugsnag.com')
  })
})
