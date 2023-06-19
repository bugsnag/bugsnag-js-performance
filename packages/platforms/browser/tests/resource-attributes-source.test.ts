/**
 * @jest-environment jsdom
 */

import { InMemoryPersistence } from '@bugsnag/core-performance'
import { createConfiguration } from '@bugsnag/js-performance-test-utilities'
import { type BrowserConfiguration } from '../lib/config'
import createResourceAttributesSource from '../lib/resource-attributes-source'

describe('resourceAttributesSource', () => {
  it('contains expected values', async () => {
    const persistence = new InMemoryPersistence()
    const navigator = {
      ...window.navigator,
      userAgentData: undefined,
      userAgent: 'a jest test, (like Gecko and WebKit and also Blink) etc...'
    }

    await persistence.save('bugsnag-anonymous-id', 'c1234567890abcdefghijklmnop')

    const resourceAttributesSource = createResourceAttributesSource(navigator, persistence)
    const resourceAttributes = resourceAttributesSource(
      createConfiguration<BrowserConfiguration>({ releaseStage: 'test', appVersion: '1.0.0' })
    )

    // wait for the anyonmous ID to be available (we don't actually need to load
    // it, just wait for the next iteration of the event loop)
    await persistence.load('bugsnag-anonymous-id')

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'test' } },
      { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
      { key: 'service.version', value: { stringValue: '1.0.0' } },
      { key: 'browser.user_agent', value: { stringValue: navigator.userAgent } },
      { key: 'device.id', value: { stringValue: 'c1234567890abcdefghijklmnop' } }
    ])
  })

  it('excludes service.version if appVersion is an empty string (default value)', () => {
    const navigator = {
      ...window.navigator,
      userAgentData: undefined,
      userAgent: 'a jest test, (like Gecko and WebKit and also Blink) etc...'
    }

    const resourceAttributesSource = createResourceAttributesSource(navigator, new InMemoryPersistence())
    const resourceAttributes = resourceAttributesSource(createConfiguration())

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'production' } },
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

    const resourceAttributesSource = createResourceAttributesSource(navigator, new InMemoryPersistence())
    const resourceAttributes = resourceAttributesSource(createConfiguration())

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'production' } },
      { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
      { key: 'browser.user_agent', value: { stringValue: navigator.userAgent } },
      { key: 'browser.platform', value: { stringValue: 'macOS' } },
      { key: 'browser.mobile', value: { boolValue: false } }
    ])
  })

  it('excludes device.id if it is not persisted', async () => {
    const persistence = new InMemoryPersistence()
    const navigator = {
      ...window.navigator,
      userAgentData: undefined,
      userAgent: 'a jest test, (like Gecko and WebKit and also Blink) etc...'
    }

    const resourceAttributesSource = createResourceAttributesSource(navigator, persistence)
    const resourceAttributes = resourceAttributesSource(createConfiguration())

    await persistence.load('bugsnag-anonymous-id')

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'production' } },
      { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
      { key: 'browser.user_agent', value: { stringValue: navigator.userAgent } }
    ])
  })
})
