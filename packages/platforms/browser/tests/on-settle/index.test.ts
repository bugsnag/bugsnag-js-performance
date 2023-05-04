/**
 * @jest-environment jsdom
 */

import createOnSettle from '../../lib/on-settle'
import {
  type RequestStartContext,
  type RequestEndContext,
  RequestTracker
} from '../../lib/request-tracker/request-tracker'
import { IncrementingClock, PerformanceObserverManager } from '@bugsnag/js-performance-test-utilities'

const START_CONTEXT: RequestStartContext = {
  url: 'https://www.bugsnag.com',
  method: 'GET',
  startTime: 1234
}

const END_CONTEXT: RequestEndContext = {
  endTime: 5678,
  status: 200
}

describe('onSettle', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  it('settles when all the settlers have settled', async () => {
    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 0 } }
    const fetchRequestTracker = new RequestTracker()
    const xhrRequestTracker = new RequestTracker()

    const onSettle = createOnSettle(
      new IncrementingClock(),
      document,
      fetchRequestTracker,
      xhrRequestTracker,
      manager.createPerformanceObserverFakeClass(),
      performance
    )

    const settleCallback = jest.fn()

    onSettle(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

    // everything has settled other than the load event end, so once we trigger
    // that 'settleCallback' should be called

    manager.queueEntry(manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))
    manager.flushQueue()

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).toHaveBeenCalled()
  })

  it('settles when all the settlers have settled (with DOM mutations)', async () => {
    document.body.innerHTML = `
      <p id="a">AAAAAAAAAAA</p>
      <p id="b">BBBBBBBBBBB</p>
      <p id="c">CCCCCCCCCCC</p>
    `

    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 0 } }
    const fetchRequestTracker = new RequestTracker()
    const xhrRequestTracker = new RequestTracker()

    const onSettle = createOnSettle(
      new IncrementingClock(),
      document,
      fetchRequestTracker,
      xhrRequestTracker,
      manager.createPerformanceObserverFakeClass(),
      performance
    )

    const settleCallback = jest.fn()

    onSettle(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

    manager.queueEntry(manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))
    manager.flushQueue()

    await jest.advanceTimersByTimeAsync(80)

    const d = document.createElement('p')
    d.textContent = 'DDDDDDDDDDD'
    document.body.appendChild(d)

    await jest.advanceTimersByTimeAsync(80)
    expect(settleCallback).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(20)
    expect(settleCallback).toHaveBeenCalled()
  })

  it('settles when all the settlers have settled (with fetch requests)', async () => {
    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 0 } }
    const fetchRequestTracker = new RequestTracker()
    const xhrRequestTracker = new RequestTracker()

    const onSettle = createOnSettle(
      new IncrementingClock(),
      document,
      fetchRequestTracker,
      xhrRequestTracker,
      manager.createPerformanceObserverFakeClass(),
      performance
    )

    const settleCallback = jest.fn()

    onSettle(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

    manager.queueEntry(manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))
    manager.flushQueue()

    const end = fetchRequestTracker.start(START_CONTEXT)

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).not.toHaveBeenCalled()

    end(END_CONTEXT)

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).toHaveBeenCalled()
  })

  it('settles when all the settlers have settled (with xhr requests)', async () => {
    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 0 } }
    const fetchRequestTracker = new RequestTracker()
    const xhrRequestTracker = new RequestTracker()

    const onSettle = createOnSettle(
      new IncrementingClock(),
      document,
      fetchRequestTracker,
      xhrRequestTracker,
      manager.createPerformanceObserverFakeClass(),
      performance
    )

    const settleCallback = jest.fn()

    onSettle(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

    manager.queueEntry(manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))
    manager.flushQueue()

    const end = xhrRequestTracker.start(START_CONTEXT)

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).not.toHaveBeenCalled()

    end(END_CONTEXT)

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).toHaveBeenCalled()
  })

  it('settles after the 60 second timeout if the settlers have not settled', async () => {
    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 0 } }

    const onSettle = createOnSettle(
      new IncrementingClock(),
      document,
      new RequestTracker(),
      new RequestTracker(),
      manager.createPerformanceObserverFakeClass(),
      performance
    )

    const settleCallback = jest.fn()

    onSettle(settleCallback)

    expect(settleCallback).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(59_900)
    expect(settleCallback).toHaveBeenCalled()
  })

  it('does not settle more than once if both the timeout and settlers settle', async () => {
    const manager = new PerformanceObserverManager()
    const performance = { timing: { loadEventEnd: 0 } }

    const onSettle = createOnSettle(
      new IncrementingClock(),
      document,
      new RequestTracker(),
      new RequestTracker(),
      manager.createPerformanceObserverFakeClass(),
      performance
    )

    const settleCallback = jest.fn()

    onSettle(settleCallback)

    expect(settleCallback).not.toHaveBeenCalled()

    const finishedEntry = manager.createPerformanceNavigationTimingFake({ loadEventEnd: 100 })

    manager.queueEntry(finishedEntry)
    manager.flushQueue()

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(59_900)
    expect(settleCallback).toHaveBeenCalledTimes(1)

    await jest.advanceTimersByTimeAsync(60_000)
    expect(settleCallback).toHaveBeenCalledTimes(1)
  })
})
