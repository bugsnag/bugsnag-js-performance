import createXmlHttpRequestTracker from '../../lib/request-tracker/request-tracker-xhr'
import { type RequestEndCallback, type RequestStartCallback } from '../../lib/request-tracker/request-tracker'
import { IncrementingClock } from '@bugsnag/js-performance-test-utilities'
import { type Clock } from '@bugsnag/js-performance-core'

const TEST_URL = 'http://test-url.com/'

function getXmlHttpRequestFake (success: boolean = true, responseStatus: number = 200) {
  class XmlHttpRequestFake {
    static readonly DONE: 4 = 4
    _listeners: { readystatechange: Array<() => void> } = { readystatechange: [] }
    readyState: number = 0
    status: number = 0
  }

  // @ts-expect-error open
  XmlHttpRequestFake.prototype.open = jest.fn(function (method: string, url: string | URL) {
    this.readyState = 1
    for (const onReadyStateChange of this._listeners.readystatechange) onReadyStateChange()
  })

  // @ts-expect-error send
  XmlHttpRequestFake.prototype.send = jest.fn(function (body?: any) {
    this.readyState = 4
    if (success) this.status = responseStatus
    for (const onReadyStateChange of this._listeners.readystatechange) onReadyStateChange()
  })

  // @ts-expect-error addEventListener
  XmlHttpRequestFake.prototype.addEventListener = jest.fn(function (evt: 'readystatechange', listener: () => void) {
    this._listeners[evt].push(listener)
  })

  return XmlHttpRequestFake
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

  it.each([['GET', 200], ['PUT', 200], ['POST', 201], ['DELETE', 204]])('should track a %s request', (method, status) => {
    const window = { XMLHttpRequest: getXmlHttpRequestFake(true, status) as unknown as typeof XMLHttpRequest }
    const mockOpen = window.XMLHttpRequest.prototype.open
    const xhrTracker = createXmlHttpRequestTracker(window, clock)

    xhrTracker.onStart(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const request = new window.XMLHttpRequest()
    request.open(method, TEST_URL)

    expect(window.XMLHttpRequest.prototype.addEventListener).toHaveBeenCalled()
    expect(mockOpen).toHaveBeenCalledWith(method, TEST_URL)
    expect(startCallback).not.toHaveBeenCalled()

    request.send()
    expect(window.XMLHttpRequest.prototype.send).toHaveBeenCalled()
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

  it('should track requests when the URL is not a string', () => {
    const window = { XMLHttpRequest: getXmlHttpRequestFake() as unknown as typeof XMLHttpRequest }
    const xhrTracker = createXmlHttpRequestTracker(window, clock)

    xhrTracker.onStart(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const request = new window.XMLHttpRequest()
    request.open('GET', new URL(TEST_URL))
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

  it('should pass down additional open arguments', () => {
    const window = { XMLHttpRequest: getXmlHttpRequestFake() as unknown as typeof XMLHttpRequest }
    const originalOpen = window.XMLHttpRequest.prototype.open
    const xhrTracker = createXmlHttpRequestTracker(window, clock)

    xhrTracker.onStart(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const request = new window.XMLHttpRequest()
    request.open('GET', TEST_URL, false, 'testUser', 'testPassword')
    expect(startCallback).not.toHaveBeenCalled()
    expect(originalOpen).toHaveBeenCalledWith('GET', TEST_URL, false, 'testUser', 'testPassword')

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
