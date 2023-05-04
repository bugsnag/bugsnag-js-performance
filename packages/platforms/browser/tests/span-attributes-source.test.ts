/**
 * @jest-environment jsdom
 */

import createSpanAttributesSource from '../lib/span-attributes-source'

describe('spanAttributesSource', () => {
  it('includes common span attributes', () => {
    const spanAttributesSource = createSpanAttributesSource(document.title, window.location.href)
    const spanAttributes = spanAttributesSource()
    const url = spanAttributes.get('bugsnag.browser.page.url')
    expect(url).toMatch(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}(\.[a-z]{2,4})?\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g)
    const title = spanAttributes.get('bugsnag.browser.page.title')
    expect(title).toBe('')
  })
})
