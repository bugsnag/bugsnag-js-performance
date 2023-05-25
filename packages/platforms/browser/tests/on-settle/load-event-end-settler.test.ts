/**
 * @jest-environment jsdom
 */

import LoadEventEndSettler from '../../lib/on-settle/load-event-end-settler'
import { IncrementingClock } from '@bugsnag/js-performance-test-utilities'
import {
  PerformanceFake,
  createPerformanceNavigationTimingFake
} from '../utilities'

class EventTarget {
  private readonly callbacks: Record<string, Array<() => void>> = {}

  readonly addEventListener = (eventType: string, callback: () => void): void => {
    this.callbacks[eventType] ||= []
    this.callbacks[eventType].push(callback)
  }

  dispatchEvent (eventType: string) {
    for (const callback of this.callbacks[eventType]) {
      callback()
    }
  }
}

jest.useFakeTimers()

describe('LoadEventEndSettler', () => {
  it('settles when the load event has finished', async () => {
    const clock = new IncrementingClock({ currentTime: 250 })
    const eventTarget = new EventTarget()
    const performance = new PerformanceFake()
    performance.addEntry(createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))

    const settler = new LoadEventEndSettler(
      clock,
      eventTarget.addEventListener,
      performance,
      { readyState: 'loading' }
    )

    const settleCallback = jest.fn()

    settler.subscribe(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    eventTarget.dispatchEvent('load')

    // settling is delayed by a macrotask to ensure the load event has ended so
    // it should have settled yet
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    await jest.runAllTimersAsync()

    expect(settleCallback).toHaveBeenCalledWith(100)
    expect(settler.isSettled()).toBe(true)
  })

  it('can handle multiple callbacks', async () => {
    const clock = new IncrementingClock({ currentTime: 250 })
    const eventTarget = new EventTarget()
    const performance = new PerformanceFake()
    performance.addEntry(createPerformanceNavigationTimingFake({ loadEventEnd: 220 }))

    const settler = new LoadEventEndSettler(
      clock,
      eventTarget.addEventListener,
      performance,
      { readyState: 'loading' }
    )

    const settleCallback1 = jest.fn()
    const settleCallback2 = jest.fn()
    const settleCallback3 = jest.fn()

    settler.subscribe(settleCallback1)
    settler.subscribe(settleCallback2)
    settler.subscribe(settleCallback3)

    expect(settleCallback1).not.toHaveBeenCalled()
    expect(settleCallback2).not.toHaveBeenCalled()
    expect(settleCallback3).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    eventTarget.dispatchEvent('load')

    // settling is delayed by a macrotask to ensure the load event has ended so
    // it should have settled yet
    expect(settleCallback1).not.toHaveBeenCalled()
    expect(settleCallback2).not.toHaveBeenCalled()
    expect(settleCallback3).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    await jest.runAllTimersAsync()

    expect(settleCallback1).toHaveBeenCalledWith(220)
    expect(settleCallback2).toHaveBeenCalledWith(220)
    expect(settleCallback3).toHaveBeenCalledWith(220)
    expect(settler.isSettled()).toBe(true)
  })

  it('can unsubscribe a callback', async () => {
    const clock = new IncrementingClock({ currentTime: 20 })
    const eventTarget = new EventTarget()
    const performance = new PerformanceFake()
    performance.addEntry(createPerformanceNavigationTimingFake({ loadEventEnd: 10 }))

    const settler = new LoadEventEndSettler(
      clock,
      eventTarget.addEventListener,
      performance,
      { readyState: 'loading' }
    )

    const settleCallback1 = jest.fn()
    const settleCallback2 = jest.fn()

    settler.subscribe(settleCallback1)
    settler.subscribe(settleCallback2)

    expect(settleCallback1).not.toHaveBeenCalled()
    expect(settleCallback2).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    settler.unsubscribe(settleCallback2)

    eventTarget.dispatchEvent('load')
    await jest.runAllTimersAsync()

    expect(settleCallback1).toHaveBeenCalledWith(10)
    expect(settleCallback2).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(true)
  })

  it('can use performance.timing if the "navigation" entryType is not supported', async () => {
    const eventTarget = new EventTarget()
    const performance = new PerformanceFake({
      timing: { navigationStart: 12, loadEventEnd: 34 }
    })

    const settler = new LoadEventEndSettler(
      new IncrementingClock({ currentTime: 150 }),
      eventTarget.addEventListener,
      performance,
      { readyState: 'loading' }
    )

    const settleCallback = jest.fn()

    settler.subscribe(settleCallback)

    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    eventTarget.dispatchEvent('load')

    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    await jest.runAllTimersAsync()

    expect(settleCallback).toHaveBeenCalledWith(22)
    expect(settler.isSettled()).toBe(true)
  })

  it('settles immediately if document is ready', async () => {
    const clock = new IncrementingClock({ currentTime: 20 })
    const eventTarget = new EventTarget()
    const performance = new PerformanceFake()
    performance.addEntry(createPerformanceNavigationTimingFake({ loadEventEnd: 5 }))

    const settler = new LoadEventEndSettler(
      clock,
      eventTarget.addEventListener,
      performance,
      { readyState: 'complete' }
    )

    const settleCallback1 = jest.fn()
    const settleCallback2 = jest.fn()

    settler.subscribe(settleCallback1)
    settler.subscribe(settleCallback2)

    expect(settler.isSettled()).toBe(false)
    expect(settleCallback1).not.toHaveBeenCalled()
    expect(settleCallback2).not.toHaveBeenCalled()

    await jest.runAllTimersAsync()

    expect(settler.isSettled()).toBe(true)
    expect(settleCallback1).toHaveBeenCalledWith(5)
    expect(settleCallback2).toHaveBeenCalledWith(5)
  })

  it('can settle immediately if document is ready using performance.timing', async () => {
    const clock = new IncrementingClock({ currentTime: 20 })
    const eventTarget = new EventTarget()
    const performance = new PerformanceFake({
      timing: { navigationStart: 2, loadEventEnd: 5 }
    })

    const settler = new LoadEventEndSettler(
      clock,
      eventTarget.addEventListener,
      performance,
      { readyState: 'complete' }
    )

    const settleCallback1 = jest.fn()
    const settleCallback2 = jest.fn()

    settler.subscribe(settleCallback1)
    settler.subscribe(settleCallback2)

    expect(settler.isSettled()).toBe(false)
    expect(settleCallback1).not.toHaveBeenCalled()
    expect(settleCallback2).not.toHaveBeenCalled()

    await jest.runAllTimersAsync()

    expect(settler.isSettled()).toBe(true)
    expect(settleCallback1).toHaveBeenCalledWith(3)
    expect(settleCallback2).toHaveBeenCalledWith(3)
  })
})
