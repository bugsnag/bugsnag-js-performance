import core from '../lib/core'

describe('core', () => {
  it('returns a string', () => {
    expect(core()).toStrictEqual('Hello from core')
  })
})
