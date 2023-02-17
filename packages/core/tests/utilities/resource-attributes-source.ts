import type { ResourceAttributes } from '../../lib/attributes'

function resourceAttributesSource (): ResourceAttributes {
  return {
    brands: [{ name: 'Test Browser', version: '2.0' }],
    mobile: false,
    platform: 'test fixture',
    releaseStage: 'test',
    sdkName: 'bugsnag.performance.browser',
    sdkVersion: '1.2.3',
    userAgent: 'Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/20.0.3'
  }
}

export default resourceAttributesSource
