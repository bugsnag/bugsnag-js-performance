import cuid from '@bugsnag/cuid'
import { ResourceAttributes, type Persistence, type ResourceAttributeSource } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from './config'

function createResourceAttributesSource (
  navigator: Navigator,
  persistence: Persistence
): ResourceAttributeSource<BrowserConfiguration> {
  let getDeviceId: Promise<string> | undefined
  let deviceId: string | undefined

  return function resourceAttributesSource (config) {
    const attributes = new ResourceAttributes(
      config.releaseStage,
      config.appVersion,
      'bugsnag.performance.browser',
      '__VERSION__'
    )

    attributes.set('browser.user_agent', navigator.userAgent)

    // chromium only
    if (navigator.userAgentData) {
      attributes.set('browser.platform', navigator.userAgentData.platform)
      attributes.set('browser.mobile', navigator.userAgentData.mobile)
    }

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

export default createResourceAttributesSource
