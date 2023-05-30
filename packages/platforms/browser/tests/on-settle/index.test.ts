/**
 * @jest-environment jsdom
 */

import createOnSettle from '../../lib/on-settle'
import { createSchema } from '../../lib/config'
import {
  type RequestStartContext,
  type RequestEndContext,
  RequestTracker
} from '../../lib/request-tracker/request-tracker'
import {
  IncrementingClock,
  createTestClient,
  VALID_API_KEY
} from '@bugsnag/js-performance-test-utilities'
import {
  PerformanceFake,
  createPerformanceNavigationTimingFake
} from '../utilities'

const START_CONTEXT: RequestStartContext = {
  url: 'https://www.bugsnag.com',
  method: 'GET',
  startTime: 1234
}

const END_CONTEXT: RequestEndContext = {
  endTime: 5678,
  status: 200,
  state: 'success'
}

jest.useFakeTimers()

describe('onSettle', () => {
  it('settles when all the settlers have settled', async () => {
    const performance = new PerformanceFake()
    performance.addEntry(createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))

    const fetchRequestTracker = new RequestTracker()
    const xhrRequestTracker = new RequestTracker()

    const onSettle = createOnSettle(
      new IncrementingClock(),
      window,
      fetchRequestTracker,
      xhrRequestTracker,
      performance
    )

    const settleCallback = jest.fn()

    onSettle(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).toHaveBeenCalled()
  })

  it('settles when all the settlers have settled (with DOM mutations)', async () => {
    document.body.innerHTML = `
      <p id="a">AAAAAAAAAAA</p>
      <p id="b">BBBBBBBBBBB</p>
      <p id="c">CCCCCCCCCCC</p>
    `

    const performance = new PerformanceFake()
    performance.addEntry(createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))

    const fetchRequestTracker = new RequestTracker()
    const xhrRequestTracker = new RequestTracker()

    const onSettle = createOnSettle(
      new IncrementingClock(),
      window,
      fetchRequestTracker,
      xhrRequestTracker,
      performance
    )

    const settleCallback = jest.fn()

    onSettle(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

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
    const performance = new PerformanceFake()
    performance.addEntry(createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))

    const fetchRequestTracker = new RequestTracker()
    const xhrRequestTracker = new RequestTracker()

    const onSettle = createOnSettle(
      new IncrementingClock(),
      window,
      fetchRequestTracker,
      xhrRequestTracker,
      performance
    )

    const settleCallback = jest.fn()

    onSettle(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

    const end = fetchRequestTracker.start(START_CONTEXT)

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).not.toHaveBeenCalled()

    end(END_CONTEXT)

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).toHaveBeenCalled()
  })

  it('settles when all the settlers have settled (with xhr requests)', async () => {
    const performance = new PerformanceFake()
    performance.addEntry(createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))

    const fetchRequestTracker = new RequestTracker()
    const xhrRequestTracker = new RequestTracker()

    const onSettle = createOnSettle(
      new IncrementingClock(),
      window,
      fetchRequestTracker,
      xhrRequestTracker,
      performance
    )

    const settleCallback = jest.fn()

    onSettle(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

    const end = xhrRequestTracker.start(START_CONTEXT)

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).not.toHaveBeenCalled()

    end(END_CONTEXT)

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).toHaveBeenCalled()
  })

  it('settles after the 60 second timeout if the settlers have not settled', async () => {
    const performance = new PerformanceFake()
    const fetchRequestTracker = new RequestTracker()

    const onSettle = createOnSettle(
      new IncrementingClock(),
      window,
      fetchRequestTracker,
      new RequestTracker(),
      performance
    )

    fetchRequestTracker.start(START_CONTEXT)

    const settleCallback = jest.fn()

    onSettle(settleCallback)

    expect(settleCallback).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(59_900)
    expect(settleCallback).toHaveBeenCalled()
  })

  it('does not settle more than once if both the timeout and settlers settle', async () => {
    const performance = new PerformanceFake()
    performance.addEntry(createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))

    const onSettle = createOnSettle(
      new IncrementingClock(),
      window,
      new RequestTracker(),
      new RequestTracker(),
      performance
    )

    const settleCallback = jest.fn()

    onSettle(settleCallback)

    expect(settleCallback).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(59_900)
    expect(settleCallback).toHaveBeenCalledTimes(1)

    await jest.advanceTimersByTimeAsync(60_000)
    expect(settleCallback).toHaveBeenCalledTimes(1)
  })

  it('can be configured to ignore requests to certain URLs', async () => {
    const performance = new PerformanceFake()
    performance.addEntry(createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))

    const fetchRequestTracker = new RequestTracker()
    const xhrRequestTracker = new RequestTracker()

    const onSettle = createOnSettle(
      new IncrementingClock(),
      window,
      fetchRequestTracker,
      xhrRequestTracker,
      performance
    )

    const testClient = createTestClient({
      schema: createSchema(window.location.hostname),
      plugins: (spanFactory) => [onSettle]
    })

    testClient.start({
      apiKey: VALID_API_KEY,
      settleIgnoreUrls: [
        'http://www.bugsnag.com/xhr',
        /^https:\/\/www\.bugsnag\.com\/fetch\//
      ]
    })

    const settleCallback = jest.fn()

    onSettle(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

    // both requests should be ignored, so advancing by 100ms will settle
    xhrRequestTracker.start({ ...START_CONTEXT, url: 'http://www.bugsnag.com/xhr' })
    fetchRequestTracker.start({ ...START_CONTEXT, url: 'https://www.bugsnag.com/fetch/' })

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).toHaveBeenCalled()
  })
})
