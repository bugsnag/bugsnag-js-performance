import { ResourceAttributes } from '@bugsnag/js-performance-core'

function createResourceAttributesSource (navigator: Navigator, host: string): () => ResourceAttributes {
  const releaseStage = /^localhost(:\d+)?$/.test(host) ? 'development' : 'production'

  return function resourceAttributesSource () {
    const attributes = new ResourceAttributes(
      releaseStage,
      'bugsnag.performance.browser',
      '__VERSION__'
    )

    attributes.set('browser.user_agent', navigator.userAgent)

    // chromium only
    if (navigator.userAgentData) {
      attributes.set('browser.platform', navigator.userAgentData.platform)
      attributes.set('browser.mobile', navigator.userAgentData.mobile)
    }

    return attributes
  }
}

export default createResourceAttributesSource
