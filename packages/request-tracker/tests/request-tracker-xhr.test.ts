/**
 * @jest-environment jsdom
 */

import createXmlHttpRequestTracker from '../lib/request-tracker-xhr'
import { type RequestEndCallback, type RequestStartCallback } from '../lib/request-tracker'
import { IncrementingClock } from '@bugsnag/js-performance-test-utilities'
import { type Clock } from '@bugsnag/core-performance'

const TEST_URL = 'http://test-url.com/'

interface XmlHttpRequestFake {
  _listeners: { readystatechange: Array<() => void> }
  readyState: number
  status: number
}

function createXmlHttpRequestFake (success: boolean = true, responseStatus: number = 200) {
  function XmlHttpRequestFake (this: XmlHttpRequestFake) {
    this._listeners = { readystatechange: [] }
    this.readyState = 0
    this.status = 0
  }

  XmlHttpRequestFake.DONE = 4

  XmlHttpRequestFake.prototype.open = jest.fn(function (method: string, url: string | URL) {
    this.readyState = 1
    for (const onReadyStateChange of this._listeners.readystatechange) onReadyStateChange()
  })

  XmlHttpRequestFake.prototype.send = jest.fn(function (body?: any) {
    this.readyState = 4
    if (success) this.status = responseStatus
    for (const onReadyStateChange of this._listeners.readystatechange) onReadyStateChange()
  })

  XmlHttpRequestFake.prototype.addEventListener = jest.fn(function (evt: 'readystatechange', listener: () => void) {
    this._listeners[evt].push(listener)
  })

  XmlHttpRequestFake.prototype.removeEventListener = jest.fn(function (evt: 'readystatechange', listener: () => void) {
    this._listeners[evt] = this._listeners[evt].filter((existing: () => void) => existing !== listener)
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
    window.XMLHttpRequest = createXmlHttpRequestFake(true, status) as unknown as typeof XMLHttpRequest
    const originalOpen = window.XMLHttpRequest.prototype.open
    const originalSend = window.XMLHttpRequest.prototype.send
    const xhrTracker = createXmlHttpRequestTracker(XMLHttpRequest, clock, document)

    xhrTracker.onStart(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const request = new window.XMLHttpRequest()
    request.open(method, TEST_URL)

    expect(window.XMLHttpRequest.prototype.addEventListener).not.toHaveBeenCalled()
    expect(originalOpen).toHaveBeenCalledWith(method, TEST_URL)
    expect(startCallback).not.toHaveBeenCalled()

    request.send()
    expect(window.XMLHttpRequest.prototype.addEventListener).toHaveBeenCalled()
    expect(originalSend).toHaveBeenCalled()
    expect(startCallback).toHaveBeenCalledWith({
      type: 'xmlhttprequest',
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

  it('should handle relative URLs', () => {
    window.XMLHttpRequest = createXmlHttpRequestFake() as unknown as typeof XMLHttpRequest
    const xhrTracker = createXmlHttpRequestTracker(XMLHttpRequest, clock, document)

    xhrTracker.onStart(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const request = new window.XMLHttpRequest()
    request.open('GET', '/test')
    expect(startCallback).not.toHaveBeenCalled()

    request.send()
    expect(startCallback).toHaveBeenCalledWith({
      type: 'xmlhttprequest',
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

  it('should track requests when the URL is not a string', () => {
    window.XMLHttpRequest = createXmlHttpRequestFake() as unknown as typeof XMLHttpRequest
    const xhrTracker = createXmlHttpRequestTracker(XMLHttpRequest, clock, document)

    xhrTracker.onStart(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const request = new window.XMLHttpRequest()
    request.open('GET', new URL(TEST_URL))
    expect(startCallback).not.toHaveBeenCalled()

    request.send()
    expect(startCallback).toHaveBeenCalledWith({
      type: 'xmlhttprequest',
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

  it('should pass down additional open arguments', () => {
    window.XMLHttpRequest = createXmlHttpRequestFake() as unknown as typeof XMLHttpRequest
    const originalOpen = window.XMLHttpRequest.prototype.open
    const xhrTracker = createXmlHttpRequestTracker(XMLHttpRequest, clock, document)

    xhrTracker.onStart(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const request = new window.XMLHttpRequest()
    request.open('GET', TEST_URL, false, 'testUser', 'testPassword')
    expect(startCallback).not.toHaveBeenCalled()
    expect(originalOpen).toHaveBeenCalledWith('GET', TEST_URL, false, 'testUser', 'testPassword')

    request.send()
    expect(startCallback).toHaveBeenCalledWith({
      type: 'xmlhttprequest',
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

  it('should handle open -> open -> send', () => {
    window.XMLHttpRequest = createXmlHttpRequestFake() as unknown as typeof XMLHttpRequest
    const xhrTracker = createXmlHttpRequestTracker(XMLHttpRequest, clock, document)
    xhrTracker.onStart(startCallback)

    const request = new window.XMLHttpRequest()
    request.open('GET', TEST_URL)

    expect(startCallback).not.toHaveBeenCalled()
    expect(window.XMLHttpRequest.prototype.addEventListener).not.toHaveBeenCalled()

    const differentUrl = 'http://different-url.com/'
    request.open('POST', differentUrl)
    request.send()
    expect(window.XMLHttpRequest.prototype.addEventListener).toHaveBeenCalled()

    expect(startCallback).toHaveBeenCalledTimes(1)
    expect(startCallback).toHaveBeenCalledWith({
      type: 'xmlhttprequest',
      url: differentUrl,
      method: 'POST',
      startTime: 1
    })

    expect(endCallback).toHaveBeenCalledTimes(1)
    expect(endCallback).toHaveBeenCalledWith({
      status: 200,
      endTime: 2,
      state: 'success'
    })
  })

  it('should handle open -> send -> open -> send', () => {
    window.XMLHttpRequest = createXmlHttpRequestFake() as unknown as typeof XMLHttpRequest
    const xhrTracker = createXmlHttpRequestTracker(XMLHttpRequest, clock, document)
    xhrTracker.onStart(startCallback)

    const request = new window.XMLHttpRequest()
    request.open('GET', TEST_URL)

    expect(startCallback).not.toHaveBeenCalled()
    expect(window.XMLHttpRequest.prototype.addEventListener).not.toHaveBeenCalled()

    request.send()

    expect(window.XMLHttpRequest.prototype.addEventListener).toHaveBeenCalledTimes(1)
    expect(startCallback).toHaveBeenCalledWith({
      type: 'xmlhttprequest',
      url: TEST_URL,
      method: 'GET',
      startTime: 1
    })
    expect(endCallback).toHaveBeenCalledWith({
      status: 200,
      endTime: 2,
      state: 'success'
    })

    const differentUrl = 'http://different-url.com/'
    request.open('POST', differentUrl)
    request.send()

    expect(window.XMLHttpRequest.prototype.removeEventListener).toHaveBeenCalled()
    expect(window.XMLHttpRequest.prototype.addEventListener).toHaveBeenCalledTimes(2)

    expect(startCallback).toHaveBeenCalledTimes(2)
    expect(endCallback).toHaveBeenCalledTimes(2)

    expect(startCallback).toHaveBeenLastCalledWith({
      type: 'xmlhttprequest',
      url: differentUrl,
      method: 'POST',
      startTime: 3
    })
    expect(endCallback).toHaveBeenLastCalledWith({
      status: 200,
      endTime: 4,
      state: 'success'
    })
  })
})
