import type { ResourceAttributes } from '@bugsnag/js-performance-core/lib/attributes'

const version = process.env.PACKAGE_VERSION || '__VERSION__'

function createResourceAttributesSource (navigator: Navigator): () => ResourceAttributes {
  return function resourceAttributesSource () {
    return {
      releaseStage: process.env.NODE_ENV || 'production',
      sdkName: 'bugsnag.performance.browser',
      sdkVersion: version,
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
