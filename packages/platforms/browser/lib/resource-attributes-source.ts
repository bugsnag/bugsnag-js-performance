import { ResourceAttributes, type Persistence, type ResourceAttributeSource } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from './config'

function createResourceAttributesSource (
  navigator: Navigator,
  persistence: Persistence
): ResourceAttributeSource<BrowserConfiguration> {
  const getDeviceId = persistence.load('bugsnag-anonymous-id')

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

    getDeviceId.then(maybeDeviceId => {
      if (maybeDeviceId) {
        attributes.set('device.id', maybeDeviceId)
      }
    })

    return attributes
  }
}

export default createResourceAttributesSource
