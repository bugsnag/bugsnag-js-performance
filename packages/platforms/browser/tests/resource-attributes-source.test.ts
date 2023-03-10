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

    const resourceAttributesSource = createResourceAttributesSource(navigator, 'www.bugsnag.com')
    const resourceAttributes = resourceAttributesSource()

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'production' } },
      { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
      { key: 'browser.user_agent', value: { stringValue: navigator.userAgent } }
    ])
  })

  it('sets releaseStage to development on localhost (with port)', () => {
    const navigator = {
      ...window.navigator,
      userAgentData: undefined,
      userAgent: 'a jest test, (like Gecko and WebKit and also Blink) etc...'
    }

    const resourceAttributesSource = createResourceAttributesSource(navigator, 'localhost:8000')
    const resourceAttributes = resourceAttributesSource()

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'development' } },
      { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
      { key: 'browser.user_agent', value: { stringValue: navigator.userAgent } }
    ])
  })

  it('sets releaseStage to development on localhost (without port)', () => {
    const navigator = {
      ...window.navigator,
      userAgentData: undefined,
      userAgent: 'a jest test, (like Gecko and WebKit and also Blink) etc...'
    }

    const resourceAttributesSource = createResourceAttributesSource(navigator, 'localhost')
    const resourceAttributes = resourceAttributesSource()

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'development' } },
      { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
      { key: 'browser.user_agent', value: { stringValue: navigator.userAgent } }
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

    const resourceAttributesSource = createResourceAttributesSource(navigator, 'www.bugsnag.com')
    const resourceAttributes = resourceAttributesSource()

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'production' } },
      { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
      { key: 'browser.user_agent', value: { stringValue: navigator.userAgent } },
      { key: 'browser.platform', value: { stringValue: 'macOS' } },
      { key: 'browser.mobile', value: { boolValue: false } }
    ])
  })
})
