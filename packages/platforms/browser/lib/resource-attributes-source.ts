import type { ResourceAttributes } from '@bugsnag/js-performance-core'

function createResourceAttributesSource (navigator: Navigator): () => ResourceAttributes {
  return function resourceAttributesSource () {
    return {
      releaseStage: 'production',
      sdkName: 'bugsnag.performance.browser',
      sdkVersion: '__VERSION__',
      userAgent: navigator.userAgent,
      // chromium only
      ...(navigator.userAgentData
        ? {
            brands: navigator.userAgentData.brands.map(({ brand, version }) => ({ name: brand, version })),
            platform: navigator.userAgentData.platform,
            mobile: navigator.userAgentData.mobile
          }
        : {})
    }
  }
}

export default createResourceAttributesSource
