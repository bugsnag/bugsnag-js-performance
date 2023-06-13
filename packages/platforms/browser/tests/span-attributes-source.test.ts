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
    expect(Array.from(spanAttributes.entries())).toEqual([
      ['bugsnag.span.category', 'custom'],
      ['bugsnag.span.first_class', true],
      ['bugsnag.browser.page.url', 'https://www.bugsnag.com'],
      ['bugsnag.browser.page.title', 'the page title']
    ])
  })
})
