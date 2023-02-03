import * as Core from '..'

describe('Core', () => {
  describe('createClient()', () => {
    it('returns a performance client', () => {
      const testClient = Core.createClient()
      expect(testClient).toMatchObject({
        start: expect.any(Function)
      })
    })
  })
})
