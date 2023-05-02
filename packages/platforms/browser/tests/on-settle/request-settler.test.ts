/**
 * @jest-environment jsdom
 */

import RequestSettler from '../../lib/on-settle/request-settler'
import {
  type RequestStartContext,
  type RequestEndContext,
  RequestTracker
} from '../../lib/request-tracker/request-tracker'

const START_CONTEXT: RequestStartContext = {
  url: 'https://www.bugsnag.com',
  method: 'GET',
  startTime: 1234
}

const END_CONTEXT: RequestEndContext = {
  endTime: 5678,
  status: 200
}

describe('RequestSettler', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  it('is settled by default when there are no outstanding requests', () => {
    const settleCallback = jest.fn()
    const tracker = new RequestTracker()
    const settler = new RequestSettler(tracker)

    expect(settler.isSettled()).toBe(true)

    settler.subscribe(settleCallback)
    expect(settleCallback).toHaveBeenCalled()
  })

  it.failing('is not settled by default when there are outstanding requests', () => {
    const settleCallback = jest.fn()
    const tracker = new RequestTracker()

    tracker.start(START_CONTEXT)

    const settler = new RequestSettler(tracker)

    expect(settler.isSettled()).toBe(false)

    settler.subscribe(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()
  })

  it('settles 100ms after a request finishes', async () => {
    const settleCallback = jest.fn()
    const tracker = new RequestTracker()
    const settler = new RequestSettler(tracker)

    const end = tracker.start(START_CONTEXT)

    settler.subscribe(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    end(END_CONTEXT)
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    // after 99ms (1ms short of the timeout) we should not settle
    await jest.advanceTimersByTimeAsync(99)
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    // it should settle after another 1ms
    await jest.advanceTimersByTimeAsync(1)
    expect(settleCallback).toHaveBeenCalled()
    expect(settler.isSettled()).toBe(true)
  })

  it.failing('settles 100ms after a request created before construction finishes', async () => {
    const settleCallback = jest.fn()
    const tracker = new RequestTracker()

    const end = tracker.start(START_CONTEXT)

    const settler = new RequestSettler(tracker)

    settler.subscribe(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    end(END_CONTEXT)
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).toHaveBeenCalled()
    expect(settler.isSettled()).toBe(true)
  })

  it('does not settle after a request finishes if there is another outstanding request', async () => {
    const settleCallback = jest.fn()
    const tracker = new RequestTracker()
    const settler = new RequestSettler(tracker)

    const endRequest1 = tracker.start(START_CONTEXT)

    settler.subscribe(settleCallback)

    const endRequest2 = tracker.start(START_CONTEXT)

    endRequest1(END_CONTEXT)

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    endRequest2(END_CONTEXT)
    expect(settleCallback).not.toHaveBeenCalled()
    expect(settler.isSettled()).toBe(false)

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).toHaveBeenCalled()
    expect(settler.isSettled()).toBe(true)
  })

  it('can handle multiple callbacks', async () => {
    const settleCallbacks = [jest.fn(), jest.fn(), jest.fn(), jest.fn()]
    const tracker = new RequestTracker()
    const settler = new RequestSettler(tracker)

    const end = tracker.start(START_CONTEXT)

    expect(settler.isSettled()).toBe(false)

    for (const settleCallback of settleCallbacks) {
      settler.subscribe(settleCallback)
      expect(settleCallback).not.toHaveBeenCalled()
    }

    end(END_CONTEXT)
    expect(settler.isSettled()).toBe(false)

    for (const settleCallback of settleCallbacks) {
      settler.subscribe(settleCallback)
      expect(settleCallback).not.toHaveBeenCalled()
    }

    await jest.advanceTimersByTimeAsync(100)
    expect(settler.isSettled()).toBe(true)

    for (const settleCallback of settleCallbacks) {
      settler.subscribe(settleCallback)
      expect(settleCallback).toHaveBeenCalled()
    }
  })
})
