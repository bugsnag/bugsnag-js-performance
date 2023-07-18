/**
 * @jest-environment jsdom
 */

import spanAttributesSource from '../lib/span-attributes-source'

describe('spanAttributesSource', () => {
  it('allows get/set for new attributes', () => {
    const spanAttributes = spanAttributesSource()
    expect(spanAttributes.get('bugsnag.test.attribute')).toBeUndefined()
    spanAttributes.set('bugsnag.test.attribute', 'value')
    expect(spanAttributes.get('bugsnag.test.attribute')).toBe('value')
  })

  it('includes common span attributes', () => {
    const spanAttributes = spanAttributesSource()
    expect(Array.from(spanAttributes.entries())).toEqual([
      ['bugsnag.span.category', 'custom']
    ])
  })
})
