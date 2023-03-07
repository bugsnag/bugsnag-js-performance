import type { ResourceAttributes } from '@bugsnag/js-performance-core'

function createResourceAttributesSource (navigator: Navigator): () => ResourceAttributes {
  return function resourceAttributesSource () {
    const attributes: ResourceAttributes = {
      releaseStage: 'production',
      sdkName: 'bugsnag.performance.browser',
      sdkVersion: '__VERSION__',
      userAgent: navigator.userAgent
    }

    // chromium only
    if (navigator.userAgentData) {
      // attributes.brands = navigator.userAgentData.brands.map(({ brand, version }) => ({ name: brand, version })).toString()
      attributes.platform = navigator.userAgentData.platform
      attributes.mobile = navigator.userAgentData.mobile
    }

    return attributes
  }
}

export default createResourceAttributesSource
