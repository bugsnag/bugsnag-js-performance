import { InMemoryPersistence } from '@bugsnag/core-performance'
import { createConfiguration } from '@bugsnag/js-performance-test-utilities'
import { Platform } from 'react-native'
import type { ReactNativeConfiguration } from '../lib/config'
import resourceAttributesSourceFactory from '../lib/resource-attributes-source'
import NativeBugsnagPerformance from '../lib/native'

describe('resourceAttributesSource', () => {
  it('includes all expected attributes (iOS)', async () => {
    const configuration = createConfiguration<ReactNativeConfiguration>({ releaseStage: 'test', appVersion: '1.0.0', codeBundleId: '12345678' })
    const deviceInfo = NativeBugsnagPerformance.getDeviceInfo()
    const resourceAttributesSource = resourceAttributesSourceFactory(new InMemoryPersistence(), deviceInfo)
    const resourceAttributes = await resourceAttributesSource(configuration)
    const jsonAttributes = resourceAttributes.toJson()

    const getAttribute = (key: string) => jsonAttributes.find(attribute => attribute?.key === key)?.value

    expect(getAttribute('bugsnag.app.code_bundle_id')).toStrictEqual({ stringValue: '12345678' })
    expect(getAttribute('bugsnag.app.bundle_version')).toStrictEqual({ stringValue: '12345' })
    expect(getAttribute('bugsnag.app.version_code')).toBeUndefined()
    expect(getAttribute('bugsnag.app.platform')).toStrictEqual({ stringValue: 'ios' })
    expect(getAttribute('bugsnag.device.android_api_version')).toBeUndefined()
    expect(getAttribute('host.arch')).toStrictEqual({ stringValue: 'arm64' })
    expect(getAttribute('deployment.environment')).toStrictEqual({ stringValue: 'test' })
    expect(getAttribute('device.id')).toStrictEqual({ stringValue: expect.stringMatching(/^c[a-z0-9]{20,32}$/) })
    expect(getAttribute('device.manufacturer')).toStrictEqual({ stringValue: 'Apple' })
    expect(getAttribute('device.model.identifier')).toStrictEqual({ stringValue: 'iPhone14,1' })
    expect(getAttribute('os.type')).toStrictEqual({ stringValue: 'darwin' })
    expect(getAttribute('os.name')).toStrictEqual({ stringValue: 'ios' })
    expect(getAttribute('os.version')).toStrictEqual({ stringValue: '1.2.3' })
    expect(getAttribute('service.name')).toStrictEqual({ stringValue: 'my.cool.app' })
    expect(getAttribute('service.version')).toStrictEqual({ stringValue: '1.0.0' })
    expect(getAttribute('telemetry.sdk.name')).toStrictEqual({ stringValue: 'bugsnag.performance.reactnative' })
    expect(getAttribute('telemetry.sdk.version')).toStrictEqual({ stringValue: '__VERSION__' })
  })

  it('includes all expected attributes (Android)', async () => {
    // @ts-expect-error 'bugsnagWithTestPlatformSetTo' is an extension added by
    //                  our Platform mock (see '__mocks__/react-native.ts')
    await Platform.bugsnagWithTestPlatformSetTo('android', async () => {
      const configuration = createConfiguration<ReactNativeConfiguration>({ releaseStage: 'test', appVersion: '1.0.0', codeBundleId: '12345678' })
      const deviceInfo = NativeBugsnagPerformance.getDeviceInfo()
      const resourceAttributesSource = resourceAttributesSourceFactory(new InMemoryPersistence(), deviceInfo)
      const resourceAttributes = await resourceAttributesSource(configuration)
      const jsonAttributes = resourceAttributes.toJson()

      const getAttribute = (key: string) => jsonAttributes.find(attribute => attribute?.key === key)?.value

      expect(getAttribute('bugsnag.app.code_bundle_id')).toStrictEqual({ stringValue: '12345678' })
      expect(getAttribute('bugsnag.app.bundle_version')).toBeUndefined()
      expect(getAttribute('bugsnag.app.version_code')).toStrictEqual({ stringValue: '6789' })
      expect(getAttribute('bugsnag.app.platform')).toStrictEqual({ stringValue: 'android' })
      expect(getAttribute('bugsnag.device.android_api_version')).toStrictEqual({ stringValue: '123' })
      expect(getAttribute('host.arch')).toStrictEqual({ stringValue: 'x86' })
      expect(getAttribute('deployment.environment')).toStrictEqual({ stringValue: 'test' })
      expect(getAttribute('device.id')).toStrictEqual({ stringValue: expect.stringMatching(/^c[a-z0-9]{20,32}$/) })
      expect(getAttribute('device.manufacturer')).toStrictEqual({ stringValue: 'bug' })
      expect(getAttribute('device.model.identifier')).toStrictEqual({ stringValue: 'TheGoodPhone1' })
      expect(getAttribute('os.type')).toStrictEqual({ stringValue: 'linux' })
      expect(getAttribute('os.name')).toStrictEqual({ stringValue: 'android' })
      expect(getAttribute('os.version')).toStrictEqual({ stringValue: 'Snag OS 12' })
      expect(getAttribute('service.name')).toStrictEqual({ stringValue: 'my.cool.app' })
      expect(getAttribute('service.version')).toStrictEqual({ stringValue: '1.0.0' })
      expect(getAttribute('telemetry.sdk.name')).toStrictEqual({ stringValue: 'bugsnag.performance.reactnative' })
      expect(getAttribute('telemetry.sdk.version')).toStrictEqual({ stringValue: '__VERSION__' })
    })
  })

  it('uses the persisted device ID if one exists', async () => {
    const persistence = new InMemoryPersistence()
    await persistence.save('bugsnag-anonymous-id', 'an device ID :)')

    const configuration = createConfiguration<ReactNativeConfiguration>()
    const resourceAttributesSource = resourceAttributesSourceFactory(persistence)
    const resourceAttributes = await resourceAttributesSource(configuration)
    const jsonAttributes = resourceAttributes.toJson()

    const getAttribute = (key: string) => jsonAttributes.find(attribute => attribute?.key === key)?.value

    expect(getAttribute('device.id')).toStrictEqual({ stringValue: 'an device ID :)' })
  })
})
