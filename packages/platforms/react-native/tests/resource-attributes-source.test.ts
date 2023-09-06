import { InMemoryPersistence } from '@bugsnag/core-performance'
import { createConfiguration } from '@bugsnag/js-performance-test-utilities'
import { type ReactNativeConfiguration } from '../lib/config'
import { createResourceAttributesSource } from '../lib/resource-attributes-source'

describe('resourceAttributesSource', () => {
  const persistence = new InMemoryPersistence()
  const resourceAttributesSource = createResourceAttributesSource(persistence)

  it('includes all expected attributes (iOS)', async () => {
    const configuraiton = createConfiguration<ReactNativeConfiguration>({ releaseStage: 'test', appVersion: '1.0.0', appName: 'Test App', codeBundleId: '12345678' })
    const resourceAttributes = await resourceAttributesSource(configuraiton)
    const jsonAttributes = resourceAttributes.toJson()

    function getAttribute (key: string) {
      const matchingAttribute = jsonAttributes.find(attribute => attribute?.key === key)
      return matchingAttribute?.value
    }

    expect(getAttribute('bugsnag.app.code_bundle_id')).toStrictEqual({ stringValue: '12345678' })
    expect(getAttribute('deployment.environment')).toStrictEqual({ stringValue: 'test' })
    expect(getAttribute('device.id')).toStrictEqual({ stringValue: expect.stringMatching(/^c[a-z0-9]{20,32}$/) })
    expect(getAttribute('device.manufacturer')).toStrictEqual({ stringValue: 'Apple' })
    expect(getAttribute('device.model.identifier')).toStrictEqual({ stringValue: 'unknown' })
    expect(getAttribute('os.type')).toStrictEqual({ stringValue: 'darwin' })
    expect(getAttribute('os.name')).toStrictEqual({ stringValue: 'ios' })
    expect(getAttribute('os.version')).toStrictEqual({ stringValue: '1.2.3' })
    expect(getAttribute('service.name')).toStrictEqual({ stringValue: 'Test App' })
    expect(getAttribute('service.version')).toStrictEqual({ stringValue: '1.0.0' })
    expect(getAttribute('telemetry.sdk.name')).toStrictEqual({ stringValue: 'bugsnag.performance.reactnative' })
    expect(getAttribute('telemetry.sdk.version')).toStrictEqual({ stringValue: '__VERSION__' })
  })
})
