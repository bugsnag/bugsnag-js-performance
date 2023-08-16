import { ResourceAttributes, type InternalConfiguration } from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from './config'
import { Platform } from 'react-native'

function resourceAttributesSource (config: InternalConfiguration<ReactNativeConfiguration>) {
  const attributes = new ResourceAttributes(
    config.releaseStage,
    config.appVersion,
    'bugsnag.performance.reactnative',
    '__VERSION__'
  )

  attributes.set('os.type', Platform.select({ android: 'linux', ios: 'darwin', default: 'unknown' }))
  attributes.set('os.name', Platform.OS)
  attributes.set('os.version', Platform.Version.toString())
  attributes.set('service.name', config.appName)
  attributes.set('device.id', 'unknown')

  if (config.codeBundleId) {
    attributes.set('bugsnag.app.code_bundle_id', config.codeBundleId)
  }

  // @ts-expect-error Platform.constants.Manufacturer exists on android devices
  attributes.set('device.manufacturer', Platform.select({ android: Platform.constants.Manufacturer, ios: 'Apple', default: 'unknown' }))

  // @ts-expect-error Platform.constants.Model exists on android devices
  attributes.set('device.model.identifier', Platform.select({ android: Platform.constants.Model, ios: 'unknown', default: 'unknown' }))

  return Promise.resolve(attributes)
}

export default resourceAttributesSource
