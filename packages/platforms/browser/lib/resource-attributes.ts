import type { ResourceAttributes } from '@bugsnag/js-performance-core/lib/span'

export const resourceAttributes: ResourceAttributes = {
  userAgent: navigator.userAgent,
  brands: navigator.userAgentData?.brands.map(({ brand, version }) => ({ name: brand, version })) || [], // chrome only
  platform: navigator.userAgentData?.platform || '', // chrome only
  mobile: navigator.userAgentData?.mobile || false, // chrome only
  releaseStage: process.env.node_env || '',
  sdkName: 'bugsnag.performance.browser',
  sdkVersion: process.env.npm_package_version || 'unknown'
}

export default resourceAttributes
