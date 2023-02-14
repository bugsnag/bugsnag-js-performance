/**
 * @jest-environment jsdom
 */

import { resourceAttributes } from '../lib/resource-attributes'

describe('resourceAttributes', () => {
  it('includes navigator.userAgent', () => {
    expect(resourceAttributes).toEqual(expect.objectContaining({
      userAgent: expect.stringMatching(/\((?<info>.*?)\)(\s|$)|(?<name>.*?)\/(?<version>.*?)(\s|$)/gm)
    }))
  })
})
