import type { InternalConfiguration, Persistence, ResourceAttributeSource } from '@bugsnag/core-performance'
import { ResourceAttributes } from '@bugsnag/core-performance'
import cuid from '@bugsnag/cuid'
import { Platform } from 'react-native'
import type { DeviceInfo } from './NativeBugsnagPerformance'
import type { ReactNativeConfiguration } from './config'

export default function resourceAttributesSourceFactory (persistence: Persistence, deviceInfo?: DeviceInfo): ResourceAttributeSource<ReactNativeConfiguration> {
  return function resourceAttributesSource (config: InternalConfiguration<ReactNativeConfiguration>): Promise<ResourceAttributes> {
    let getDeviceId: Promise<string> | undefined
    let deviceId: string | undefined

    const attributes = new ResourceAttributes(
      config.releaseStage,
      config.appVersion,
      deviceInfo?.bundleIdentifier || 'unknown_service',
      'bugsnag.performance.reactnative',
      '__VERSION__',
      config.logger
    )

    attributes.set('os.type', Platform.select({ android: 'linux', ios: 'darwin', default: 'unknown' }))
    attributes.set('os.name', Platform.OS)
    attributes.set('bugsnag.app.platform', Platform.OS)
    // @ts-expect-error Platform.constants.Release exists on android devices

    attributes.set('os.version', Platform.select({ ios: Platform.Version.toString(), android: Platform.constants.Release, default: 'unknown' }))

    if (Platform.OS === 'android') {
      attributes.set('bugsnag.device.android_api_version', Platform.Version.toString())
    }

    if (deviceInfo) {
      if (deviceInfo.arch) {
        attributes.set('host.arch', deviceInfo.arch)
      }

      if (deviceInfo.bundleVersion) {
        attributes.set('bugsnag.app.bundle_version', deviceInfo.bundleVersion)
      }

      if (deviceInfo.versionCode) {
        attributes.set('bugsnag.app.version_code', deviceInfo.versionCode)
      }

      if (deviceInfo.model) {
        attributes.set('device.model.identifier', deviceInfo.model)
      }
    }

    if (config.codeBundleId) {
      attributes.set('bugsnag.app.code_bundle_id', config.codeBundleId)
    }

    // @ts-expect-error Platform.constants.Manufacturer exists on android devices
    attributes.set('device.manufacturer', Platform.select({ android: Platform.constants.Manufacturer, ios: 'Apple', default: 'unknown' }))

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
}
