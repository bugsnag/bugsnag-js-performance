/**
 * @jest-environment jsdom
 */

import createFetchRequestTracker from '../lib/request-tracker-fetch'
import { type RequestEndCallback, type RequestStartCallback } from '../lib/request-tracker'
import { IncrementingClock } from '@bugsnag/js-performance-test-utilities'
import { type Clock } from '@bugsnag/core-performance'

const TEST_URL = 'http://test-url.com/'

function createFetchFake (fail: boolean = false, status: number = 200) {
  return (input: RequestInfo | URL, init?: RequestInit | undefined) => {
    return new Promise<Response>((resolve, reject) => {
      if (fail) {
        reject(new Error('Fail'))
      } else {
        resolve({ status } as unknown as Response)
      }
    })
  }
}

describe('fetch Request Tracker', () => {
  let clock: Clock
  let startCallback: jest.MockedFunction<RequestStartCallback>
  let endCallback: jest.MockedFunction<RequestEndCallback>

  beforeEach(() => {
    clock = new IncrementingClock()
    endCallback = jest.fn()
    startCallback = jest.fn(context => endCallback)
  })

  it.each([['GET', 200], ['PUT', 200], ['POST', 201], ['DELETE', 204]])('should notify subscribers for a completed %s request', async (method, status) => {
    window.fetch = createFetchFake(false, status)
    const fetchTracker = createFetchRequestTracker(window, clock)

    fetchTracker.onStart(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const response = await window.fetch(TEST_URL, { method })
    expect(response.status).toEqual(status)

    expect(startCallback).toHaveBeenCalledWith({
      type: 'fetch',
      url: TEST_URL,
      method,
      startTime: 1
    })
    expect(endCallback).toHaveBeenCalledWith({
      status,
      endTime: 2,
      state: 'success'
    })
  })

  it('should notify subscribers and reject when a request errors', async () => {
    window.fetch = createFetchFake(true)
    const fetchTracker = createFetchRequestTracker(window, clock)
    fetchTracker.onStart(startCallback)

    await expect(window.fetch(TEST_URL)).rejects.toEqual(new Error('Fail'))
    expect(startCallback).toHaveBeenCalledWith({
      type: 'fetch',
      url: TEST_URL,
      method: 'GET',
      startTime: 1
    })
    expect(endCallback).toHaveBeenCalledWith({
      error: new Error('Fail'),
      endTime: 2,
      state: 'error'
    })
    expect.assertions(3)
  })

  it('should handle a fetch with no method specified', async () => {
    window.fetch = createFetchFake()
    const fetchTracker = createFetchRequestTracker(window, clock)
    fetchTracker.onStart(startCallback)

    const response = await window.fetch(TEST_URL)
    expect(response.status).toEqual(200)

    expect(startCallback).toHaveBeenCalledWith({
      type: 'fetch',
      url: TEST_URL,
      method: 'GET',
      startTime: 1
    })
    expect(endCallback).toHaveBeenCalledWith({
      status: 200,
      endTime: 2,
      state: 'success'
    })
  })

  it('should handle a URL object', async () => {
    window.fetch = createFetchFake()
    const fetchTracker = createFetchRequestTracker(window, clock)
    fetchTracker.onStart(startCallback)

    const response = await window.fetch(new URL(TEST_URL))
    expect(response.status).toEqual(200)

    expect(startCallback).toHaveBeenCalledWith({
      type: 'fetch',
      url: TEST_URL,
      method: 'GET',
      startTime: 1
    })
    expect(endCallback).toHaveBeenCalledWith({
      status: 200,
      endTime: 2,
      state: 'success'
    })
  })

  it('should handle a Request object', async () => {
    window.fetch = createFetchFake()
    const fetchTracker = createFetchRequestTracker(window, clock)
    fetchTracker.onStart(startCallback)

    const response = await window.fetch({ url: TEST_URL, method: 'POST' } as unknown as Request)
    expect(response.status).toEqual(200)

    expect(startCallback).toHaveBeenCalledWith({
      type: 'fetch',
      url: TEST_URL,
      method: 'POST',
      startTime: 1
    })
    expect(endCallback).toHaveBeenCalledWith({
      status: 200,
      endTime: 2,
      state: 'success'
    })
  })

  it('should handle a Request object with separate options', async () => {
    window.fetch = createFetchFake()
    const fetchTracker = createFetchRequestTracker(window, clock)
    fetchTracker.onStart(startCallback)

    const response = await window.fetch({ url: TEST_URL, method: 'GET' } as unknown as Request, { method: 'POST' })
    expect(response.status).toEqual(200)

    expect(startCallback).toHaveBeenCalledWith({
      type: 'fetch',
      url: TEST_URL,
      method: 'POST',
      startTime: 1
    })
    expect(endCallback).toHaveBeenCalledWith({
      status: 200,
      endTime: 2,
      state: 'success'
    })
  })

  it('should handle relative URLs', async () => {
    window.fetch = createFetchFake()
    const fetchTracker = createFetchRequestTracker(window, clock)
    fetchTracker.onStart(startCallback)

    const response = await window.fetch('/test')
    expect(response.status).toEqual(200)

    expect(startCallback).toHaveBeenCalledWith({
      type: 'fetch',
      url: `${window.location.origin}/test`,
      method: 'GET',
      startTime: 1
    })
    expect(endCallback).toHaveBeenCalledWith({
      status: 200,
      endTime: 2,
      state: 'success'
    })
  })

  it('should handle a fetch(undefined)', async () => {
    window.fetch = createFetchFake(true)
    const fetchTracker = createFetchRequestTracker(window, clock)
    fetchTracker.onStart(startCallback)

    await expect(window.fetch(undefined as unknown as string)).rejects.toEqual(new Error('Fail'))
    expect(startCallback).toHaveBeenCalledWith({
      type: 'fetch',
      url: `${window.location.origin}/undefined`,
      method: 'GET',
      startTime: 1
    })
    expect(endCallback).toHaveBeenCalledWith({
      error: new Error('Fail'),
      endTime: 2,
      state: 'error'
    })

    expect.assertions(3)
  })

  it('should handle a fetch(null)', async () => {
    window.fetch = createFetchFake(true)
    const fetchTracker = createFetchRequestTracker(window, clock)
    fetchTracker.onStart(startCallback)

    await expect(window.fetch(null as unknown as RequestInfo)).rejects.toEqual(new Error('Fail'))
    expect(startCallback).toHaveBeenCalledWith({
      type: 'fetch',
      url: `${window.location.origin}/null`,
      method: 'GET',
      startTime: 1
    })
    expect(endCallback).toHaveBeenCalledWith({
      error: new Error('Fail'),
      endTime: 2,
      state: 'error'
    })

    expect.assertions(3)
  })

  it('should handle a fetch(url, null)', async () => {
    window.fetch = createFetchFake()
    const fetchTracker = createFetchRequestTracker(window, clock)
    fetchTracker.onStart(startCallback)

    const response = await window.fetch(TEST_URL, null as unknown as RequestInit)
    expect(response.status).toEqual(200)
    expect(startCallback).toHaveBeenCalledWith({
      type: 'fetch',
      url: TEST_URL,
      method: 'GET',
      startTime: 1
    })
    expect(endCallback).toHaveBeenCalledWith({
      status: 200,
      endTime: 2,
      state: 'success'
    })
  })

  it('should handle a fetch(url, {}})', async () => {
    window.fetch = createFetchFake()
    const fetchTracker = createFetchRequestTracker(window, clock)
    fetchTracker.onStart(startCallback)

    const response = await window.fetch(TEST_URL, {})
    expect(response.status).toEqual(200)

    expect(startCallback).toHaveBeenCalledWith({
      type: 'fetch',
      url: TEST_URL,
      method: 'GET',
      startTime: 1
    })
    expect(endCallback).toHaveBeenCalledWith({
      status: 200,
      endTime: 2,
      state: 'success'
    })
  })
})
