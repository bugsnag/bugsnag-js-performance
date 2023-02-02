import spanFactory from '../dist/spanFactory.js'

describe('spanFactory', () => {
  it('generates timestamps using a provided clock function', () => {
    const mockClock = jest.fn()
    const mockDelivery = jest.fn()
    const testSpanFactory = spanFactory(mockClock, mockDelivery)

    testSpanFactory.newSpan({ name: 'test span' })

    expect(mockClock).toHaveBeenCalled()
  })
})
