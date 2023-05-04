/**
 * @jest-environment jsdom
 */

import LoadEventEndSettler from '../../lib/on-settle/load-event-end-settler'
import { PerformanceObserverManager } from '@bugsnag/js-performance-test-utilities'

describe('LoadEventEndSettler', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('settles when the load event has finished', () => {
    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 0 } }
    const settleCallback = jest.fn()
    const settler = new LoadEventEndSettler(manager.createPerformanceObserverFakeClass(), performance)

    settler.subscribe(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    const notFinishedEntry = manager.createPerformanceNavigationTimingFake()

    manager.queueEntry(notFinishedEntry)
    manager.flushQueue()
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    const finishedEntry = manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 })

    manager.queueEntry(finishedEntry)
    manager.flushQueue()
    expect(settleCallback).toHaveBeenCalled()
    expect(settler.isSettled()).toBe(true)
  })

  it('can handle multiple callbacks', () => {
    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 0 } }
    const settleCallback1 = jest.fn()
    const settleCallback2 = jest.fn()
    const settleCallback3 = jest.fn()
    const settler = new LoadEventEndSettler(manager.createPerformanceObserverFakeClass(), performance)

    settler.subscribe(settleCallback1)
    settler.subscribe(settleCallback2)
    settler.subscribe(settleCallback3)

    expect(settleCallback1).not.toHaveBeenCalled()
    expect(settleCallback2).not.toHaveBeenCalled()
    expect(settleCallback3).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    manager.queueEntry(manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))
    manager.flushQueue()

    expect(settleCallback1).toHaveBeenCalled()
    expect(settleCallback2).toHaveBeenCalled()
    expect(settleCallback3).toHaveBeenCalled()
    expect(settler.isSettled()).toBe(true)
  })

  it('can unsubscribe a callback', () => {
    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 0 } }
    const settleCallback1 = jest.fn()
    const settleCallback2 = jest.fn()
    const settler = new LoadEventEndSettler(manager.createPerformanceObserverFakeClass(), performance)

    settler.subscribe(settleCallback1)
    settler.subscribe(settleCallback2)

    expect(settleCallback1).not.toHaveBeenCalled()
    expect(settleCallback2).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    settler.unsubscribe(settleCallback2)

    manager.queueEntry(manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))
    manager.flushQueue()

    expect(settleCallback1).toHaveBeenCalled()
    expect(settleCallback2).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(true)
  })

  it('settles immediately if already settled', () => {
    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 0 } }
    const settler = new LoadEventEndSettler(manager.createPerformanceObserverFakeClass(), performance)

    expect(settler.isSettled()).toBe(false)

    manager.queueEntry(manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))
    manager.flushQueue()

    expect(settler.isSettled()).toBe(true)

    const settleCallback1 = jest.fn()
    const settleCallback2 = jest.fn()

    settler.subscribe(settleCallback1)
    expect(settleCallback1).toHaveBeenCalled()

    settler.subscribe(settleCallback2)
    expect(settleCallback2).toHaveBeenCalled()
  })

  it('does not re-trigger if duplicate events fire', () => {
    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 0 } }
    const settleCallback = jest.fn()
    const settler = new LoadEventEndSettler(manager.createPerformanceObserverFakeClass(), performance)

    settler.subscribe(settleCallback)

    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    const finishedEntry = manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 })

    manager.queueEntry(finishedEntry)
    manager.queueEntry(finishedEntry)
    manager.queueEntry(finishedEntry)
    manager.flushQueue()

    expect(settleCallback).toHaveBeenCalledTimes(1)
    expect(settler.isSettled()).toBe(true)

    manager.queueEntry(finishedEntry)
    manager.flushQueue()

    expect(settleCallback).toHaveBeenCalledTimes(1)
    expect(settler.isSettled()).toBe(true)
  })

  it('can use performance.timing if "supportedEntryTypes" is not supported', async () => {
    jest.useFakeTimers()

    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 0 } }
    const settleCallback = jest.fn()
    const settler = new LoadEventEndSettler(
      manager.createPerformanceObserverFakeClass(null),
      performance
    )

    settler.subscribe(settleCallback)

    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    // sanity check that a PerformanceNavigationTiming event won't settle
    const finishedEntry = manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 })

    manager.queueEntry(finishedEntry)
    manager.flushQueue()

    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    performance.timing.loadEventEnd = 1234

    await jest.runAllTimersAsync()

    expect(settleCallback).toHaveBeenCalledTimes(1)
    expect(settler.isSettled()).toBe(true)
  })

  it('can use performance.timing if "supportedEntryTypes" does not contain "navigation"', async () => {
    jest.useFakeTimers()

    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 0 } }
    const settleCallback = jest.fn()
    const settler = new LoadEventEndSettler(
      manager.createPerformanceObserverFakeClass(['mark', 'measure']),
      performance
    )

    settler.subscribe(settleCallback)

    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    // sanity check that a PerformanceNavigationTiming event won't settle
    const finishedEntry = manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 })

    manager.queueEntry(finishedEntry)
    manager.flushQueue()

    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    performance.timing.loadEventEnd = 1234

    await jest.runAllTimersAsync()

    expect(settleCallback).toHaveBeenCalledTimes(1)
    expect(settler.isSettled()).toBe(true)
  })

  it('can settle immediately using performance.timing if loadEventEnd is valid', () => {
    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 1234 } }
    const settleCallback = jest.fn()
    const settler = new LoadEventEndSettler(
      manager.createPerformanceObserverFakeClass(null),
      performance
    )

    expect(settler.isSettled()).toBe(true)

    settler.subscribe(settleCallback)

    expect(settleCallback).toHaveBeenCalledTimes(1)
    expect(settler.isSettled()).toBe(true)
  })

  it('does not settle more than once using performance.timing', async () => {
    jest.useFakeTimers()

    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 0 } }
    const settleCallback = jest.fn()
    const settler = new LoadEventEndSettler(
      manager.createPerformanceObserverFakeClass(null),
      performance
    )

    settler.subscribe(settleCallback)

    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    performance.timing.loadEventEnd = 100
    await jest.runAllTimersAsync()

    expect(settleCallback).toHaveBeenCalledTimes(1)
    expect(settler.isSettled()).toBe(true)

    performance.timing.loadEventEnd = 200
    await jest.runAllTimersAsync()

    expect(settleCallback).toHaveBeenCalledTimes(1)
    expect(settler.isSettled()).toBe(true)
  })

  it('does not settle more than once using performance.timing if loadEventEnd is valid', async () => {
    jest.useFakeTimers()

    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 1 } }
    const settleCallback = jest.fn()
    const settler = new LoadEventEndSettler(
      manager.createPerformanceObserverFakeClass(null),
      performance
    )

    expect(settler.isSettled()).toBe(true)

    settler.subscribe(settleCallback)

    expect(settleCallback).toHaveBeenCalledTimes(1)
    expect(settler.isSettled()).toBe(true)

    performance.timing.loadEventEnd = 2
    await jest.runAllTimersAsync()

    expect(settleCallback).toHaveBeenCalledTimes(1)
    expect(settler.isSettled()).toBe(true)
  })
})
