/**
 * @jest-environment jsdom
 */

import LoadEventEndSettler from '../../lib/on-settle/load-event-end-settler'
import { PerformanceObserverManager } from '@bugsnag/js-performance-test-utilities'

describe('LoadEventEndSettler', () => {
  it('settles when the load event has finished', () => {
    const manager = new PerformanceObserverManager()
    const settleCallback = jest.fn()
    const settler = new LoadEventEndSettler(manager.createPerformanceObserverFakeClass())

    settler.subscribe(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

    const notFinishedEntry = manager.createPerformanceNavigationTimingFake()

    manager.queueEntry(notFinishedEntry)
    manager.flushQueue()
    expect(settleCallback).not.toHaveBeenCalled()

    const finishedEntry = manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 })

    manager.queueEntry(finishedEntry)
    manager.flushQueue()
    expect(settleCallback).toHaveBeenCalled()
  })

  it('can handle multiple callbacks', () => {
    const manager = new PerformanceObserverManager()
    const settleCallback1 = jest.fn()
    const settleCallback2 = jest.fn()
    const settleCallback3 = jest.fn()
    const settler = new LoadEventEndSettler(manager.createPerformanceObserverFakeClass())

    settler.subscribe(settleCallback1)
    settler.subscribe(settleCallback2)
    settler.subscribe(settleCallback3)

    expect(settleCallback1).not.toHaveBeenCalled()
    expect(settleCallback2).not.toHaveBeenCalled()
    expect(settleCallback3).not.toHaveBeenCalled()

    manager.queueEntry(manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))
    manager.flushQueue()

    expect(settleCallback1).toHaveBeenCalled()
    expect(settleCallback2).toHaveBeenCalled()
    expect(settleCallback3).toHaveBeenCalled()
  })

  it('settles immediately if already settled', () => {
    const manager = new PerformanceObserverManager()
    const settler = new LoadEventEndSettler(manager.createPerformanceObserverFakeClass())

    manager.queueEntry(manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))
    manager.flushQueue()

    const settleCallback1 = jest.fn()
    const settleCallback2 = jest.fn()

    settler.subscribe(settleCallback1)
    expect(settleCallback1).toHaveBeenCalled()

    settler.subscribe(settleCallback2)
    expect(settleCallback2).toHaveBeenCalled()
  })

  it('does not re-trigger if duplicate events fire', () => {
    const manager = new PerformanceObserverManager()
    const settleCallback = jest.fn()
    const settler = new LoadEventEndSettler(manager.createPerformanceObserverFakeClass())

    settler.subscribe(settleCallback)

    expect(settleCallback).not.toHaveBeenCalled()

    const finishedEntry = manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 })

    manager.queueEntry(finishedEntry)
    manager.queueEntry(finishedEntry)
    manager.queueEntry(finishedEntry)
    manager.flushQueue()

    expect(settleCallback).toHaveBeenCalledTimes(1)

    manager.queueEntry(finishedEntry)
    manager.flushQueue()

    expect(settleCallback).toHaveBeenCalledTimes(1)
  })
})
