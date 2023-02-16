/**
 * @jest-environment jsdom
 */

import createResourceAttributesSource from '../lib/resource-attributes-source'

describe('resourceAttributesSource', () => {
  it('includes the userAgent', () => {
    const resourceAttributesSource = createResourceAttributesSource(navigator)
    expect(resourceAttributesSource()).toEqual(expect.objectContaining({
      userAgent: expect.stringMatching(/\((?<info>.*?)\)(\s|$)|(?<name>.*?)\/(?<version>.*?)(\s|$)/gm),
      releaseStage: expect.any(String),
      sdkName: 'bugsnag.performance.browser',
      sdkVersion: expect.any(String)
    }))
  })
})
