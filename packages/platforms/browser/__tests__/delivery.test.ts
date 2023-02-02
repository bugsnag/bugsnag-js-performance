import delivery from '../src/delivery'

describe('delivery', () => {
  it('returns a delivery payload', () => {
    delivery({ body: "", headers: {}}).then(res => {
      expect(res).toStrictEqual({ success: true })
    })
  })
})
