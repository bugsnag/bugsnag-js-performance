import { ResourceAttributes, type InternalConfiguration } from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from './config'
import { Platform } from 'react-native'
import { getReactNativePersistence } from './persistence'
import cuid from '@bugsnag/cuid'

const persistence = getReactNativePersistence()

function resourceAttributesSource (config: InternalConfiguration<ReactNativeConfiguration>) {
  let getDeviceId: Promise<string> | undefined
  let deviceId: string | undefined

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

  if (config.codeBundleId) {
    attributes.set('bugsnag.app.code_bundle_id', config.codeBundleId)
  }

  // @ts-expect-error Platform.constants.Manufacturer exists on android devices
  attributes.set('device.manufacturer', Platform.select({ android: Platform.constants.Manufacturer, ios: 'Apple', default: 'unknown' }))

  // @ts-expect-error Platform.constants.Model exists on android devices
  attributes.set('device.model.identifier', Platform.select({ android: Platform.constants.Model, ios: 'unknown', default: 'unknown' }))

  if (config.generateAnonymousId) {
    // ensure we only load/generate the anonymous ID once no matter how many
    // times we're called, otherwise we could generate different IDs on
    // different calls as cuids are partly time based
    if (!getDeviceId) {
      getDeviceId = persistence.load('bugsnag-anonymous-id')
        .then(maybeAnonymousId => {
          // use the persisted value or generate a new ID
          const anonymousId = maybeAnonymousId || cuid()

          // if there was no persisted value, save the newly generated ID
          if (!maybeAnonymousId) {
            persistence.save('bugsnag-anonymous-id', anonymousId)
          }

          // store the device ID so we can set it synchronously in future
          deviceId = anonymousId

          return deviceId
        })
    }

    if (deviceId) {
      // set device ID synchronously if it's already available
      attributes.set('device.id', deviceId)
    } else {
      // otherwise add it when the promise resolves
      return getDeviceId
        .then(deviceId => {
          attributes.set('device.id', deviceId)

          return attributes
        })
    }
  }

  return Promise.resolve(attributes)
}

export default resourceAttributesSource
