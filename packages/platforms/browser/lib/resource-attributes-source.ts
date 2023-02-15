import type { ResourceAttributes } from '@bugsnag/js-performance-core/lib/span'

export function resourceAttributesSource (): ResourceAttributes {
  return {
    releaseStage: process.env.node_env || 'unknown',
    sdkName: 'bugsnag.performance.browser',
    sdkVersion: process.env.npm_package_version || 'unknown',
    userAgent: navigator.userAgent,
    // chrome only
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
