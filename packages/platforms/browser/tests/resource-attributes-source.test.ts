/**
 * @jest-environment jsdom
 */

import createResourceAttributesSource from '../lib/resource-attributes-source'

describe('resourceAttributesSource', () => {
  it('contains expected values', () => {
    const navigator = {
      ...window.navigator,
      userAgentData: undefined,
      userAgent: 'a jest test, (like Gecko and WebKit and also Blink) etc...'
    }

    const resourceAttributesSource = createResourceAttributesSource(navigator)
    const resourceAttributes = resourceAttributesSource()

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'releaseStage', value: { stringValue: 'production' } },
      { key: 'sdkName', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'sdkVersion', value: { stringValue: '__VERSION__' } },
      { key: 'userAgent', value: { stringValue: navigator.userAgent } }
    ])
  })

  it('includes browser.platform and browser.mobile if available', () => {
    const navigator = {
      ...window.navigator,
      userAgentData: {
        platform: 'macOS',
        mobile: false
      },
      userAgent: 'a jest test, (like Gecko and WebKit and also Blink) etc...'
    }

    const resourceAttributesSource = createResourceAttributesSource(navigator)
    const resourceAttributes = resourceAttributesSource()

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'releaseStage', value: { stringValue: 'production' } },
      { key: 'sdkName', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'sdkVersion', value: { stringValue: '__VERSION__' } },
      { key: 'userAgent', value: { stringValue: navigator.userAgent } },
      { key: 'platform', value: { stringValue: 'macOS' } },
      { key: 'mobile', value: { boolValue: false } }
    ])
  })
})
