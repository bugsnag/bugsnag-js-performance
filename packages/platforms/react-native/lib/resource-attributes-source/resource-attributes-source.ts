import { ResourceAttributes, type Configuration, type InternalConfiguration } from '@bugsnag/core-performance'
import { Platform } from 'react-native'

export function resourceAttributesSource (config: InternalConfiguration<Configuration>) {
  const attributes = new ResourceAttributes(
    config.releaseStage,
    config.appVersion,
    'bugsnag.performance.reactnative',
    '__VERSION__'
  )

  attributes.set('os.type', Platform.select({ android: 'linux', ios: 'darwin', default: 'unknown' }))
  attributes.set('os.name', Platform.OS)
  attributes.set('os.version', Platform.Version.toString())
  attributes.set('service.name', '__NAME__')
  attributes.set('device.id', 'unknown')
  attributes.set('bugsnag.app.code_bundle_id', 'unknown')

  // @ts-expect-error Platform.constants.Manufacturer exists on android devices
  attributes.set('device.manufacturer', Platform.select({ ios: 'Apple', default: Platform.constants.Manufacturer }))

  // @ts-expect-error Platform.constants.Serial exists on android devices
  attributes.set('device.model.identifier', Platform.select({ android: Platform.constants.Serial, default: 'unknown' }))

  return Promise.resolve(attributes)
}
