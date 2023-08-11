import { createConfiguration } from '@bugsnag/js-performance-test-utilities'
import { resourceAttributesSource } from './resource-attributes-source'
import { type Configuration } from '@bugsnag/core-performance'

describe('resourceAttributesSource', () => {
  it('includes core attributes', async () => {
    const configuraiton = createConfiguration<Configuration>({ releaseStage: 'test', appVersion: '1.0.0' })
    const resourceAttributes = await resourceAttributesSource(configuraiton)

    expect(resourceAttributes.toJson()).toEqual([
      {
        key: 'deployment.environment',
        value: {
          stringValue: 'test'
        }
      },
      {
        key: 'telemetry.sdk.name',
        value: {
          stringValue: 'bugsnag.performance.reactnative'
        }
      },
      {
        key: 'telemetry.sdk.version',
        value: {
          stringValue: '__VERSION__'
        }
      },
      {
        key: 'service.version',
        value: {
          stringValue: '1.0.0'
        }
      }
    ])
  })
})
