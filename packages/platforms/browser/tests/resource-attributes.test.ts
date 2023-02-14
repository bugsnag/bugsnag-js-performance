/**
 * @jest-environment jsdom
 */

import { resourceAttributes } from '../lib/resource-attributes'

const jsDomUserAgent = 'Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/20.0.3'

describe('resourceAttributes', () => {
  it('includes navigator.userAgent', () => {
    expect(resourceAttributes).toEqual(expect.objectContaining({
      userAgent: jsDomUserAgent
    }))
  })
})
