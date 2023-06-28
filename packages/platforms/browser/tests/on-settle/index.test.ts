/**
 * @jest-environment jsdom
 */

import {
  IncrementingClock,
  VALID_API_KEY,
  createTestClient
} from '@bugsnag/js-performance-test-utilities'
import { createSchema } from '../../lib/config'
import createOnSettle from '../../lib/on-settle'
import {
  RequestTracker,
  type RequestEndContext,
  type RequestStartContext
} from '../../lib/request-tracker/request-tracker'
import {
  PerformanceFake,
  createPerformanceNavigationTimingFake
} from '../utilities'
import MockRoutingProvider from '../utilities/mock-routing-provider'

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

  it('applies a cooldown period if all the settlers have settled already', async () => {
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

    await jest.advanceTimersByTimeAsync(100)

    const settleCallback = jest.fn()

    onSettle(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).toHaveBeenCalled()

    // ensure we don't settle multiple times by waiting a long time
    await jest.advanceTimersByTimeAsync(1_000_000)
    expect(settleCallback).toHaveBeenCalledTimes(1)
  })

  it('handles unsettling during the cooldown period', async () => {
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

    await jest.advanceTimersByTimeAsync(100)

    const settleCallback = jest.fn()

    onSettle(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(90)
    expect(settleCallback).not.toHaveBeenCalled()

    // make a DOM mutation so we unsettle
    document.body.innerHTML = ':)'

    await jest.advanceTimersByTimeAsync(90)
    expect(settleCallback).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(10)
    expect(settleCallback).toHaveBeenCalledTimes(1)

    // ensure we don't settle multiple times by waiting a long time
    await jest.advanceTimersByTimeAsync(1_000_000)
    expect(settleCallback).toHaveBeenCalledTimes(1)
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
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
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

  it('ignores requests to the default endpoint', async () => {
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
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      plugins: (spanFactory) => [onSettle]
    })

    testClient.start(VALID_API_KEY)

    const settleCallback = jest.fn()

    onSettle(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

    // request should be ignored, so advancing by 100ms will settle
    fetchRequestTracker.start({ ...START_CONTEXT, url: 'https://otlp.bugsnag.com/v1/traces' })

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).toHaveBeenCalled()
  })

  it('ignores requests to the configured endpoint', async () => {
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
      schema: createSchema(window.location.hostname, new MockRoutingProvider()),
      plugins: (spanFactory) => [onSettle]
    })

    testClient.start({
      apiKey: VALID_API_KEY,
      endpoint: 'https://www.bugsnag.com'
    })

    const settleCallback = jest.fn()

    onSettle(settleCallback)
    expect(settleCallback).not.toHaveBeenCalled()

    // request should be ignored, so advancing by 100ms will settle
    fetchRequestTracker.start({ ...START_CONTEXT, url: 'https://www.bugsnag.com/a/b/c' })

    await jest.advanceTimersByTimeAsync(100)
    expect(settleCallback).toHaveBeenCalled()
  })

  it('handles performnace.getEntriesByType not being a function (PLAT-10204)', async () => {
    const performance = new PerformanceFake()
    performance.addEntry(createPerformanceNavigationTimingFake({ loadEventEnd: 100 }))

    // @ts-expect-error unexpected type
    performance.getEntriesByType = 'string'

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
})
