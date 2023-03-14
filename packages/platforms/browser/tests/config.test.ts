import { createSchema } from '../lib/config'

describe('createSchema', () => {
  it('sets releaseStage.defaultValue to development on localhost', () => {
    const schema = createSchema('localhost')
    expect(schema.releaseStage.defaultValue).toStrictEqual('development')
  })

  it('sets releaseStage.defaultValue to production on another host', () => {
    const schema = createSchema('bugsnag.com')
    expect(schema.releaseStage.defaultValue).toStrictEqual('production')
  })
})
