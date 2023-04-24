/**
 * @jest-environment jsdom
 */

import TimeoutSettler from '../lib/timeout-settler'

describe('TimeoutSettler', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  it('settles when the given timeout has elapsed', async () => {
    const settleCallback = jest.fn()
    const settler = new TimeoutSettler(10)

    settler.subscribe(settleCallback)

    // advance by 9ms - 1ms short of when the timeout should fire
    for (let i = 0; i < 9; ++i) {
      await jest.advanceTimersByTimeAsync(1)
      expect(settleCallback).not.toHaveBeenCalled()
    }

    await jest.advanceTimersByTimeAsync(1)
    expect(settleCallback).toHaveBeenCalled()
  })

  it('can handle multiple callbacks', async () => {
    const callbacks = [jest.fn(), jest.fn(), jest.fn(), jest.fn(), jest.fn()]

    const settler = new TimeoutSettler(100)

    for (const callback of callbacks) {
      settler.subscribe(callback)
      expect(callback).not.toHaveBeenCalled()
    }

    await jest.advanceTimersByTimeAsync(100)

    for (const callback of callbacks) {
      expect(callback).toHaveBeenCalled()
    }
  })

  it('calls callbacks immediately if already settled', async () => {
    const settleCallback1 = jest.fn()
    const settleCallback2 = jest.fn()

    const settler = new TimeoutSettler(50)

    await jest.advanceTimersByTimeAsync(150)

    settler.subscribe(settleCallback1)
    settler.subscribe(settleCallback2)

    expect(settleCallback1).toHaveBeenCalled()
    expect(settleCallback2).toHaveBeenCalled()
  })
})
