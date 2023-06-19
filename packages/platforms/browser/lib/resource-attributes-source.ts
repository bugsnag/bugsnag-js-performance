import cuid from '@bugsnag/cuid'
import { ResourceAttributes, type Persistence, type ResourceAttributeSource } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from './config'

function createResourceAttributesSource (
  navigator: Navigator,
  persistence: Persistence
): ResourceAttributeSource<BrowserConfiguration> {
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
      persistence.load('bugsnag-anonymous-id').then(maybeDeviceId => {
        // use the persisted value or generate a new ID
        const deviceId = maybeDeviceId || cuid()

        // if there was no persisted value, save the newly generated ID
        if (!maybeDeviceId) {
          persistence.save('bugsnag-anonymous-id', deviceId)
        }

        attributes.set('device.id', deviceId)
      })
    }

    return attributes
  }
}

export default createResourceAttributesSource
