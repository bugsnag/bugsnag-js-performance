/**
 * @jest-environment jsdom
 */

import createResourceAttributesSource from '../lib/resource-attributes-source'

describe('resourceAttributesSource', () => {
  it('includes the userAgent', () => {
    const resourceAttributesSource = createResourceAttributesSource(navigator)
    expect(resourceAttributesSource()).toEqual({
      userAgent: expect.stringMatching(/\((?<info>.*?)\)(\s|$)|(?<name>.*?)\/(?<version>.*?)(\s|$)/g),
      releaseStage: 'production',
      sdkName: 'bugsnag.performance.browser',
      sdkVersion: '__VERSION__'
    })
  })
})
