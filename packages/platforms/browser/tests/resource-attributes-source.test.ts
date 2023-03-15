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
    const resourceAttributes = resourceAttributesSource({
      apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      endpoint: '/traces',
      releaseStage: 'test',
      logger: {
        debug: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
      },
      appVersion: '1.0.0'
    })

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'test' } },
      { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
      { key: 'service.version', value: { stringValue: '1.0.0' } },
      { key: 'browser.user_agent', value: { stringValue: navigator.userAgent } }
    ])
  })

  it('excludes service.version if appVersion is an empty string (default value)', () => {
    const navigator = {
      ...window.navigator,
      userAgentData: undefined,
      userAgent: 'a jest test, (like Gecko and WebKit and also Blink) etc...'
    }

    const resourceAttributesSource = createResourceAttributesSource(navigator)
    const resourceAttributes = resourceAttributesSource({
      apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      endpoint: '/traces',
      releaseStage: 'test',
      logger: {
        debug: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
      },
      appVersion: ''
    })

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'test' } },
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

    const resourceAttributesSource = createResourceAttributesSource(navigator)
    const resourceAttributes = resourceAttributesSource({
      apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      endpoint: '/traces',
      releaseStage: 'production',
      logger: {
        debug: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
      },
      appVersion: ''
    })

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
