/**
 * @jest-environment jsdom
 */

import { spanAttributesSource } from '../lib/span-attributes-source'

describe('spanAttributesSource', () => {
  it('includes the userAgent', () => {
    const attributes = spanAttributesSource()

    console.log({ attributes })
    expect(spanAttributesSource()).toEqual(expect.objectContaining({
      'browser.page.url': expect.stringMatching(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}(\.[a-z]{2,4})?\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g) // URL Regex including http://localhost
    }))
  })
})
