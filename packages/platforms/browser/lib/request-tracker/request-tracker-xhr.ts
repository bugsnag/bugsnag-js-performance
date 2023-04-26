import { type Clock } from '@bugsnag/js-performance-core'
import { type RequestEndCallback, RequestTracker } from './request-tracker'

interface WindowWithXMLHttpRequest {
  XMLHttpRequest: typeof XMLHttpRequest
}

type OpenFunction = (
  method: string,
  url: string | URL,
  async?: boolean,
  username?: string | null,
  password?: string | null
) => void

function overrideOpen (window: WindowWithXMLHttpRequest, requestTracker: RequestTracker, clock: Clock): OpenFunction {
  const originalOpen = window.XMLHttpRequest.prototype.open as OpenFunction
  return function open (this: XMLHttpRequest, ...args): void {
    const method = args[0]
    const url = args[1]

    // start tracking the request on send
    const originalSend = this.send
    let onRequestEnd: RequestEndCallback
    this.send = function send (body?: Document | XMLHttpRequestBodyInit | null) {
      onRequestEnd = requestTracker.start({ method, url: String(url), startTime: clock.now() })
      originalSend.call(this, body)
    }

    // for now report all requests on completion - if the request errors or is aborted, status will be 0
    this.addEventListener('readystatechange', () => {
      if (this.readyState === window.XMLHttpRequest.DONE && onRequestEnd) {
        onRequestEnd({ status: this.status, endTime: clock.now() })
      }
    })

    originalOpen.apply(this, args)
  }
}

function createXMLHttpRequestTracker (window: WindowWithXMLHttpRequest, clock: Clock): RequestTracker {
  const requestTracker = new RequestTracker()
  window.XMLHttpRequest.prototype.open = overrideOpen(window, requestTracker, clock)
  return requestTracker
}

export default createXMLHttpRequestTracker
