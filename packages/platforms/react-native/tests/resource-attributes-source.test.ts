import { InMemoryPersistence } from '@bugsnag/core-performance'
import { createConfiguration } from '@bugsnag/js-performance-test-utilities'
import { type ReactNativeConfiguration } from '../lib/config'
import resourceAttributesSourceFactory from '../lib/resource-attributes-source'

const NativeBugsnagPerformanceFake = {
  getDeviceInfo: () => {
    return {
      arch: 'arm64',
      model: 'iPhone14,1',
      bundleVersion: '12345'
    }
  }
}

jest.mock('react-native', () => {
  return {
    _esModule: true,
    TurboModuleRegistry: {
      get: () => {
        return NativeBugsnagPerformanceFake
      }
    },
    Platform: {
      OS: 'ios',
      Version: '1.2.3',
      select: (options: { android?: string, ios?: string, default?: string }) => {
        return options.ios
      },
      constants: {
        Manufacturer: undefined, // only exists on Android
        Model: undefined // only exists on Android
      }
    }
  }
})

describe('resourceAttributesSource', () => {
  it('includes all expected attributes (iOS)', async () => {
    const configuraiton = createConfiguration<ReactNativeConfiguration>({ releaseStage: 'test', appVersion: '1.0.0', appName: 'Test App', codeBundleId: '12345678' })
    const resourceAttributesSource = resourceAttributesSourceFactory(new InMemoryPersistence())
    const resourceAttributes = await resourceAttributesSource(configuraiton)
    const jsonAttributes = resourceAttributes.toJson()

    function getAttribute (key: string) {
      const matchingAttribute = jsonAttributes.find(attribute => attribute?.key === key)
      return matchingAttribute?.value
    }

    expect(getAttribute('bugsnag.app.code_bundle_id')).toStrictEqual({ stringValue: '12345678' })
    expect(getAttribute('bugsnag.app.bundle_version')).toStrictEqual({ stringValue: '12345' })
    expect(getAttribute('host.arch')).toStrictEqual({ stringValue: 'arm64' })
    expect(getAttribute('deployment.environment')).toStrictEqual({ stringValue: 'test' })
    expect(getAttribute('device.id')).toStrictEqual({ stringValue: expect.stringMatching(/^c[a-z0-9]{20,32}$/) })
    expect(getAttribute('device.manufacturer')).toStrictEqual({ stringValue: 'Apple' })
    expect(getAttribute('device.model.identifier')).toStrictEqual({ stringValue: 'iPhone14,1' })
    expect(getAttribute('os.type')).toStrictEqual({ stringValue: 'darwin' })
    expect(getAttribute('os.name')).toStrictEqual({ stringValue: 'ios' })
    expect(getAttribute('os.version')).toStrictEqual({ stringValue: '1.2.3' })
    expect(getAttribute('service.name')).toStrictEqual({ stringValue: 'Test App' })
    expect(getAttribute('service.version')).toStrictEqual({ stringValue: '1.0.0' })
    expect(getAttribute('telemetry.sdk.name')).toStrictEqual({ stringValue: 'bugsnag.performance.reactnative' })
    expect(getAttribute('telemetry.sdk.version')).toStrictEqual({ stringValue: '__VERSION__' })
  })

  it('uses the persisted device ID if one exists', async () => {
    const persistence = new InMemoryPersistence()
    await persistence.save('bugsnag-anonymous-id', 'an device ID :)')

    const configuraiton = createConfiguration<ReactNativeConfiguration>()
    const resourceAttributesSource = resourceAttributesSourceFactory(persistence)
    const resourceAttributes = await resourceAttributesSource(configuraiton)
    const jsonAttributes = resourceAttributes.toJson()

    function getAttribute (key: string) {
      const matchingAttribute = jsonAttributes.find(attribute => attribute?.key === key)
      return matchingAttribute?.value
    }

    expect(getAttribute('device.id')).toStrictEqual({ stringValue: 'an device ID :)' })
  })
})
