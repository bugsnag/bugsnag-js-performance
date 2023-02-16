import type { ResourceAttributes } from '@bugsnag/js-performance-core/lib/span'

export function resourceAttributesSource (): ResourceAttributes {
  return {
    releaseStage: process.env.NODE_ENV || 'production',
    sdkName: 'bugsnag.performance.browser',
    sdkVersion: process.env.NPM_PACKAGE_VERSION || 'unknown',
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

export default resourceAttributesSource
