import browser from '../lib/browser'

describe('browser', () => {
  it('returns a string', () => {
    expect(browser()).toStrictEqual('Hello from browser')
  })
})
