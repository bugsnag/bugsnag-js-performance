/**
 * @jest-environment jsdom
 */

import createResourceAttributesSource from '../lib/resource-attributes-source'

describe('resourceAttributesSource', () => {
  it('includes the userAgent', () => {
    const resourceAttributesSource = createResourceAttributesSource(navigator)
    expect(resourceAttributesSource()).toEqual({
      userAgent: expect.stringMatching(/\((?<info>.*?)\)(\s|$)|(?<name>.*?)\/(?<version>.*?)(\s|$)/g),
      releaseStage: 'test',
      sdkName: 'bugsnag.performance.browser',
      sdkVersion: expect.stringMatching(/\d{1,2}\.\d{1,2}\.\d{1,3}/g)
    })
  })
})
