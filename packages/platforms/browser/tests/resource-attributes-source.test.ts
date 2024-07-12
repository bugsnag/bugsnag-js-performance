/**
 * @jest-environment jsdom
 */

import { InMemoryPersistence } from '@bugsnag/core-performance'
import { createConfiguration } from '@bugsnag/js-performance-test-utilities'
import type { BrowserConfiguration } from '../lib/config'
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
    expect(await persistence.load('bugsnag-anonymous-id')).toBe('c1234567890abcdefghijklmnop')

    const resourceAttributesSource = createResourceAttributesSource(navigator, persistence)
    const resourceAttributes = await resourceAttributesSource(
      createConfiguration<BrowserConfiguration>({ releaseStage: 'test', appVersion: '1.0.0' })
    )

    // ensure the anyonmous ID hasn't changed
    expect(await persistence.load('bugsnag-anonymous-id')).toBe('c1234567890abcdefghijklmnop')

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'test' } },
      { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
      { key: 'service.version', value: { stringValue: '1.0.0' } },
      { key: 'browser.user_agent', value: { stringValue: navigator.userAgent } },
      { key: 'device.id', value: { stringValue: 'c1234567890abcdefghijklmnop' } }
    ])
  })

  it('excludes service.version if appVersion is an empty string (default value)', async () => {
    const navigator = {
      ...window.navigator,
      userAgentData: undefined,
      userAgent: 'a jest test, (like Gecko and WebKit and also Blink) etc...'
    }

    const resourceAttributesSource = createResourceAttributesSource(navigator, new InMemoryPersistence())
    const resourceAttributes = await resourceAttributesSource(createConfiguration())

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'production' } },
      { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
      { key: 'browser.user_agent', value: { stringValue: navigator.userAgent } },
      { key: 'device.id', value: { stringValue: expect.stringMatching(/^c[0-9a-z]{20,32}$/) } }
    ])
  })

  it('includes browser.platform and browser.mobile if available', async () => {
    const navigator = {
      ...window.navigator,
      userAgentData: {
        platform: 'macOS',
        mobile: false
      },
      userAgent: 'a jest test, (like Gecko and WebKit and also Blink) etc...'
    }

    const resourceAttributesSource = createResourceAttributesSource(navigator, new InMemoryPersistence())
    const resourceAttributes = await resourceAttributesSource(createConfiguration())

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'production' } },
      { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
      { key: 'browser.user_agent', value: { stringValue: navigator.userAgent } },
      { key: 'browser.platform', value: { stringValue: 'macOS' } },
      { key: 'browser.mobile', value: { boolValue: false } },
      { key: 'device.id', value: { stringValue: expect.stringMatching(/^c[0-9a-z]{20,32}$/) } }
    ])
  })

  it('generates a new device.id if it is not persisted', async () => {
    const persistence = new InMemoryPersistence()
    const navigator = {
      ...window.navigator,
      userAgentData: undefined,
      userAgent: 'a jest test, (like Gecko and WebKit and also Blink) etc...'
    }

    // ensure no device ID is persisted
    expect(await persistence.load('bugsnag-anonymous-id')).toBeUndefined()

    const resourceAttributesSource = createResourceAttributesSource(navigator, persistence)
    const resourceAttributes = await resourceAttributesSource(createConfiguration())

    const deviceId = await persistence.load('bugsnag-anonymous-id')

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'production' } },
      { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
      { key: 'browser.user_agent', value: { stringValue: navigator.userAgent } },
      { key: 'device.id', value: { stringValue: deviceId } }
    ])
  })

  it('only generates a single device.id across multiple calls', async () => {
    const persistence = new InMemoryPersistence()
    const navigator = {
      ...window.navigator,
      userAgentData: undefined,
      userAgent: 'a jest test, (like Gecko and WebKit and also Blink) etc...'
    }

    // ensure no device ID is persisted
    expect(await persistence.load('bugsnag-anonymous-id')).toBeUndefined()

    const resourceAttributesSource = createResourceAttributesSource(navigator, persistence)
    const configuration = createConfiguration<BrowserConfiguration>()

    const resourceAttributesPromise1 = resourceAttributesSource(configuration)
    const resourceAttributesPromise2 = resourceAttributesSource(configuration)
    const resourceAttributesPromise3 = resourceAttributesSource(configuration)

    const [
      resourceAttributes1,
      resourceAttributes2,
      resourceAttributes3
    ] = await Promise.all([
      resourceAttributesPromise1,
      resourceAttributesPromise2,
      resourceAttributesPromise3
    ])

    const deviceId = await persistence.load('bugsnag-anonymous-id')

    expect(resourceAttributes1.toJson()).toStrictEqual([
      { key: 'deployment.environment', value: { stringValue: 'production' } },
      { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
      { key: 'browser.user_agent', value: { stringValue: navigator.userAgent } },
      { key: 'device.id', value: { stringValue: deviceId } }
    ])

    expect(resourceAttributes1.toJson()).toStrictEqual(resourceAttributes2.toJson())
    expect(resourceAttributes2.toJson()).toStrictEqual(resourceAttributes3.toJson())

    const resourceAttributes4 = await resourceAttributesSource(configuration)
    expect(resourceAttributes3.toJson()).toStrictEqual(resourceAttributes4.toJson())

    // device ID shouldn't have changed
    expect(await persistence.load('bugsnag-anonymous-id')).toBe(deviceId)
  })

  it('does not generate a device.id if generateAnonymousId is false', async () => {
    const persistence = new InMemoryPersistence()
    const navigator = {
      ...window.navigator,
      userAgentData: undefined,
      userAgent: 'a jest test, (like Gecko and WebKit and also Blink) etc...'
    }

    // ensure no device ID is persisted
    expect(await persistence.load('bugsnag-anonymous-id')).toBeUndefined()

    const resourceAttributesSource = createResourceAttributesSource(navigator, persistence)
    const resourceAttributes = await resourceAttributesSource(
      createConfiguration<BrowserConfiguration>({ generateAnonymousId: false })
    )

    // wait for the new ID to actually be persisted so we can load it
    await new Promise<void>(resolve => { resolve() })

    // an ID should not be generated
    expect(await persistence.load('bugsnag-anonymous-id')).toBeUndefined()

    expect(resourceAttributes.toJson()).toEqual([
      { key: 'deployment.environment', value: { stringValue: 'production' } },
      { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
      { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
      { key: 'browser.user_agent', value: { stringValue: navigator.userAgent } }
      // the device.id attribute should not exist
    ])
  })
})
