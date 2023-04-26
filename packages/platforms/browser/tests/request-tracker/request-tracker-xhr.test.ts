import createXMLHttpRequestTracker from '../../lib/request-tracker/request-tracker-xhr'
import { type RequestEndCallback, type RequestStartCallback } from '../../lib/request-tracker/request-tracker'
import { IncrementingClock } from '@bugsnag/js-performance-test-utilities'
import { type Clock } from '@bugsnag/js-performance-core'

const TEST_URL = 'http://test-url.com/'

class XMLHttpRequest {
  static readonly DONE: 4 = 4
  _listeners: { readystatechange: Array<() => void> }
  _success: boolean = true
  _responseStatus: number = 200
  readyState: number = 0
  status: number = 0

  constructor () {
    this._listeners = { readystatechange: [] }
  }

  open (method: string, url: string | { toString: () => string }, success: boolean = true, responseStatus: number = 200) {
    this._success = success
    this._responseStatus = responseStatus
    this.readyState = 1
    for (const onReadyStateChange of this._listeners.readystatechange) onReadyStateChange()
  }

  send (body?: any) {
    this.readyState = 4
    if (this._success) this.status = this._responseStatus
    for (const onReadyStateChange of this._listeners.readystatechange) onReadyStateChange()
  }

  addEventListener (evt: 'readystatechange', listener: () => void) {
    this._listeners[evt].push(listener)
  }

  removeEventListener (evt: 'readystatechange', listener: () => void) {
    this._listeners[evt] = this._listeners[evt].filter(cb => cb === listener)
  }
}

describe('XHR Request Tracker', () => {
  let clock: Clock
  let startCallback: jest.MockedFunction<RequestStartCallback>
  let endCallback: jest.MockedFunction<RequestEndCallback>

  beforeEach(() => {
    clock = new IncrementingClock()
    endCallback = jest.fn()
    startCallback = jest.fn(context => endCallback)
  })

  it.each([['GET', 200], ['PUT', 200], ['POST', 201], ['DELETE', 204]])('should track a %s request', async (method, status) => {
    const window = { XMLHttpRequest } as unknown as Window & typeof globalThis
    const xhrTracker = createXMLHttpRequestTracker(window, clock)

    xhrTracker.onStart(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const request = new window.XMLHttpRequest() as unknown as XMLHttpRequest
    request.open(method, TEST_URL, true, status)
    expect(startCallback).not.toHaveBeenCalled()

    request.send()
    expect(startCallback).toHaveBeenCalledWith({
      url: TEST_URL,
      method,
      startTime: 1
    })
    expect(endCallback).toHaveBeenCalledWith({
      status,
      endTime: 2
    })
  })

  it('should track requests when the URL is not a string', async () => {
    const window = { XMLHttpRequest } as unknown as Window & typeof globalThis
    const xhrTracker = createXMLHttpRequestTracker(window, clock)

    xhrTracker.onStart(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const request = new window.XMLHttpRequest() as unknown as XMLHttpRequest
    request.open('GET', { toString: () => TEST_URL })
    expect(startCallback).not.toHaveBeenCalled()

    request.send()
    expect(startCallback).toHaveBeenCalledWith({
      url: TEST_URL,
      method: 'GET',
      startTime: 1
    })
    expect(endCallback).toHaveBeenCalledWith({
      status: 200,
      endTime: 2
    })
  })
})
