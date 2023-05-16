/**
 * @jest-environment jsdom
 */

import DomMutationSettler from '../../lib/on-settle/dom-mutation-settler'
import createClock from '../../lib/clock'
import { IncrementingClock } from '@bugsnag/js-performance-test-utilities'

describe('DomMutationSettler', () => {
  beforeEach(() => {
    jest.useFakeTimers()

    document.body.innerHTML = `
      <div id="a">
        <p id="b">hello</p>
      </div>

      <button id="c">click em</button>
    `
  })

  it('settles after 100ms when no dom mutation happens', async () => {
    const settleCallback = jest.fn()
    const settler = new DomMutationSettler(createClock(performance), document.body)

    settler.subscribe(settleCallback)

    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    await jest.advanceTimersByTimeAsync(100)

    expect(settleCallback).toHaveBeenCalledTimes(1)
    expect(settler.isSettled()).toBe(true)

    // the 100ms timeout is not included in the final 'settled time'
    expect(settleCallback).toHaveBeenCalledWith(0)
  })

  it('can handle multiple callbacks', async () => {
    const settleCallback1 = jest.fn()
    const settleCallback2 = jest.fn()
    const settleCallback3 = jest.fn()

    const settler = new DomMutationSettler(new IncrementingClock(), document.body)

    settler.subscribe(settleCallback1)
    settler.subscribe(settleCallback2)
    settler.subscribe(settleCallback3)

    expect(settleCallback1).not.toHaveBeenCalled()
    expect(settleCallback2).not.toHaveBeenCalled()
    expect(settleCallback3).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    await jest.advanceTimersByTimeAsync(100)

    expect(settleCallback1).toHaveBeenCalledTimes(1)
    expect(settleCallback2).toHaveBeenCalledTimes(1)
    expect(settleCallback3).toHaveBeenCalledTimes(1)
    expect(settler.isSettled()).toBe(true)
  })

  it('can unsubscribe a callback', async () => {
    const settleCallback1 = jest.fn()
    const settleCallback2 = jest.fn()

    const settler = new DomMutationSettler(new IncrementingClock(), document.body)

    settler.subscribe(settleCallback1)
    settler.subscribe(settleCallback2)

    expect(settleCallback1).not.toHaveBeenCalled()
    expect(settleCallback2).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    settler.unsubscribe(settleCallback2)

    await jest.advanceTimersByTimeAsync(100)

    expect(settleCallback1).toHaveBeenCalledTimes(1)
    expect(settleCallback2).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(true)
  })

  it('settles immediately if the dom is already settled', async () => {
    const settler = new DomMutationSettler(new IncrementingClock(), document.body)

    await jest.advanceTimersByTimeAsync(100)

    expect(settler.isSettled()).toBe(true)

    const settleCallback = jest.fn()
    settler.subscribe(settleCallback)

    expect(settleCallback).toHaveBeenCalledTimes(1)
  })

  it('doesnt settle until no dom mutations have happend for 100 consecutive milliseconds', async () => {
    const settleCallback = jest.fn()
    const settler = new DomMutationSettler(createClock(performance), document.body)

    settler.subscribe(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    await jest.advanceTimersByTimeAsync(80)
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    // fix a typo
    // @ts-expect-error 'c' definitely exists
    document.getElementById('c').innerHTML = 'click me'

    await jest.advanceTimersByTimeAsync(80)
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    // mutate something again
    // @ts-expect-error 'a' definitely exists
    document.getElementById('a').innerHTML = '<p>:)</p>'

    await jest.advanceTimersByTimeAsync(80)
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    await jest.advanceTimersByTimeAsync(20)
    expect(settleCallback).toHaveBeenCalledWith(160)
    expect(settler.isSettled()).toBe(true)
  })
})
