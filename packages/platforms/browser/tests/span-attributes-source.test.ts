/**
 * @jest-environment jsdom
 */

import createSpanAttributesSource from '../lib/span-attributes-source'

describe('spanAttributesSource', () => {
  it('includes common span attributes', () => {
    const spanAttributesSource = createSpanAttributesSource(document.title, window.location.href)
    const spanAttributes = spanAttributesSource()
    expect(spanAttributes.get('bugsnag.span.category')).toBe('custom')
    expect(spanAttributes.get('bugsnag.span.first_class')).toBe(true)
    expect(spanAttributes.get('bugsnag.browser.page.title')).toBe('')
    expect(spanAttributes.get('bugsnag.browser.page.url')).toMatch(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}(\.[a-z]{2,4})?\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g)
  })
})
