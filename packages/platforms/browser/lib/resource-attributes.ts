import { type ResourceAttributes } from '@bugsnag/js-performance-core/lib/span'

export const resourceAttributes: ResourceAttributes = {
  brands: navigator.userAgentData?.brands.map(({ brand, version }) => ({ name: brand, version })) || [],
  platform: navigator.userAgentData?.platform || '',
  mobile: navigator.userAgentData?.mobile || false, // browser.mobile
  userAgent: navigator.userAgent,
  releaseStage: 'development', // deployment.environment
  sdkName: 'bugsnag.performance.browser', // telemetry.sdk.name
  sdkVersion: process.env.npm_package_version || 'unknown' // telemetry.sdk.version
}

export default resourceAttributes
