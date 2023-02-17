/**
 * @jest-environment jsdom
 */

import BugsnagPerformance from '../lib/browser'

describe('BugsnagPerformance Browser Client', () => {
  it('exposes a start method', () => {
    expect(BugsnagPerformance).toMatchObject({
      start: expect.any(Function)
    })
  })

  it('exposes a startSpan method', () => {
    expect(BugsnagPerformance).toMatchObject({
      startSpan: expect.any(Function)
    })
  })
})
