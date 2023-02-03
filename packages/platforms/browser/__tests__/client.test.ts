import BugsnagPerformance from '..'

describe('client', () => {
  describe('start()', () => {
    it('accepts an apiKey', () => {
      BugsnagPerformance.start({ apiKey: 'test-api-key' })
      expect(true).toStrictEqual(false)
    })
  })

  describe('startSpan()', () => {
    it('accepts a span name', () => {
      BugsnagPerformance.startSpan('test span')
      expect(true).toStrictEqual(true)
    })
  })
})
