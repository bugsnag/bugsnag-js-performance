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
    const spanAttributes = spanAttributesSource({ includeFirstClassAttributes: true })
    expect(Array.from(spanAttributes.entries())).toEqual([
      ['bugsnag.span.category', 'custom'],
      ['bugsnag.browser.page.url', 'https://www.bugsnag.com'],
      ['bugsnag.browser.page.title', 'the page title']
    ])
  })

  it('excludes url and title attributes when firstClass = false', () => {
    const spanAttributesSource = createSpanAttributesSource(
      'the page title',
      'https://www.bugsnag.com'
    )
    const spanAttributes = spanAttributesSource({ includeFirstClassAttributes: false })
    expect(Array.from(spanAttributes.entries())).toEqual([
      ['bugsnag.span.category', 'custom']
    ])
  })
})
