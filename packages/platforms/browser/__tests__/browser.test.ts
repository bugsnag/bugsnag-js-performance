import BugsnagPerformance from '../lib/browser'

describe('BugsnagPerformance Browser Client', () => {
  describe('start', () => {
    it('has a start method', () => {
      expect(BugsnagPerformance).toMatchObject({
        start: expect.any(Function)
      })
    })
  })
})
