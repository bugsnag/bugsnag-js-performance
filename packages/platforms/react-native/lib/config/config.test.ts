import { createSchema } from './config'

describe('createSchema', () => {
  it('includes all expected options', () => {
    const schema = createSchema()
    expect(Object.keys(schema)).toStrictEqual([
      'appVersion',
      'endpoint',
      'apiKey',
      'logger',
      'releaseStage',
      'enabledReleaseStages',
      'samplingProbability',
      'appName',
      'codeBundleId'
    ])
  })
})
