import browser from '..'

describe('browser', () => {
  it('returns a string', () => {
    expect(browser()).toStrictEqual('Hello from browser')
  })
})
