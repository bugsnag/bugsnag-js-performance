/**
 * @jest-environment jsdom
 */

import spanAttributesSource from '../lib/span-attributes-source'

describe('spanAttributesSource', () => {
  it('includes the page url', () => {
    const spanAttributes = spanAttributesSource()
    const url = spanAttributes.get('browser.page.url')
    expect(url).toMatch(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}(\.[a-z]{2,4})?\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g)
  })
})
