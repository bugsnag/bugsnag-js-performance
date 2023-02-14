import type { ResourceAttributes } from '@bugsnag/js-performance-core/lib/span'

export const resourceAttributes: ResourceAttributes = {
  userAgent: navigator.userAgent,
  releaseStage: process.env.node_env || 'unknown',
  sdkName: 'bugsnag.performance.browser',
  sdkVersion: process.env.npm_package_version || 'unknown',
  // chrome only
  ...(navigator.userAgentData
    ? {
        brands: navigator.userAgentData.brands.map(({ brand, version }) => ({ name: brand, version })),
        platform: navigator.userAgentData.platform,
        mobile: navigator.userAgentData.mobile
      }
    : {})
}

export default resourceAttributes
