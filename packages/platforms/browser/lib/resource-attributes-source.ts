import type { ResourceAttributes } from '@bugsnag/js-performance-core/lib/attributes'
import path from 'path'

function getPackageVersion () {
  const pkgname = path.join(__dirname, '..', 'package.json')

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(pkgname).version
}

function createResourceAttributesSource (navigator: Navigator): () => ResourceAttributes {
  return function resourceAttributesSource () {
    return {
      releaseStage: process.env.NODE_ENV || 'production',
      sdkName: 'bugsnag.performance.browser',
      sdkVersion: getPackageVersion(),
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
