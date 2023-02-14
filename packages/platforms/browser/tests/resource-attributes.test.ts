/**
 * @jest-environment jsdom
 */

import { resourceAttributes } from '../lib/resource-attributes'

describe('resourceAttributes', () => {
  it('includes the userAgent', () => {
    console.log({ resourceAttributes })
    expect(resourceAttributes).toEqual(expect.objectContaining({
      userAgent: expect.stringMatching(/\((?<info>.*?)\)(\s|$)|(?<name>.*?)\/(?<version>.*?)(\s|$)/gm),
      releaseStage: expect.any(String),
      sdkName: 'bugsnag.performance.browser',
      sdkVersion: expect.any(String)
    }))
  })
})
