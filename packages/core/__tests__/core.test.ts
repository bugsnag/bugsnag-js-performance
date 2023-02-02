import * as Core from ".."

describe('createClient()', () => {
  it('returns a client object', () => {
    expect(Core.createClient({
      clock: () => performance.now(),
    })).toMatchObject({
      start: expect.any(Function),
      startSpan: expect.any(Function)
    })
  })
})
