/**
 * @jest-environment jsdom
 */

import DomMutationSettler from '../lib/dom-mutation-settler'

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
    const settler = new DomMutationSettler(document.body)

    settler.subscribe(settleCallback)

    expect(settleCallback).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(100)

    expect(settleCallback).toHaveBeenCalledTimes(1)
  })

  it('can handle multiple callbacks', async () => {
    const settleCallback1 = jest.fn()
    const settleCallback2 = jest.fn()
    const settleCallback3 = jest.fn()

    const settler = new DomMutationSettler(document.body)

    settler.subscribe(settleCallback1)
    settler.subscribe(settleCallback2)
    settler.subscribe(settleCallback3)

    expect(settleCallback1).not.toHaveBeenCalled()
    expect(settleCallback2).not.toHaveBeenCalled()
    expect(settleCallback3).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(100)

    expect(settleCallback1).toHaveBeenCalledTimes(1)
    expect(settleCallback2).toHaveBeenCalledTimes(1)
    expect(settleCallback3).toHaveBeenCalledTimes(1)
  })

  it('settles immediately if the dom is already settled', async () => {
    const settler = new DomMutationSettler(document.body)

    await jest.advanceTimersByTimeAsync(100)

    const settleCallback = jest.fn()
    settler.subscribe(settleCallback)

    expect(settleCallback).toHaveBeenCalledTimes(1)
  })

  it('doesnt settle until no dom mutations have happend for 100 consecutive milliseconds', async () => {
    const settleCallback = jest.fn()
    const settler = new DomMutationSettler(document.body)

    settler.subscribe(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(80)
    expect(settleCallback).not.toHaveBeenCalled()

    // fix a typo
    // @ts-expect-error 'c' definitely exists
    document.getElementById('c').innerHTML = 'click me'

    await jest.advanceTimersByTimeAsync(80)
    expect(settleCallback).not.toHaveBeenCalled()

    // mutate something again
    // @ts-expect-error 'a' definitely exists
    document.getElementById('a').innerHTML = '<p>:)</p>'

    await jest.advanceTimersByTimeAsync(80)
    expect(settleCallback).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(20)
    expect(settleCallback).toHaveBeenCalled()
  })
})
