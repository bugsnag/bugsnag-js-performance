import { type Clock } from '@bugsnag/js-performance-core'
import { type RequestEndCallback, RequestTracker } from './request-tracker'

interface WindowWithXmlHttpRequest {
  XMLHttpRequest: typeof XMLHttpRequest
}

function createXmlHttpRequestTracker (window: WindowWithXmlHttpRequest, clock: Clock): RequestTracker {
  const requestTracker = new RequestTracker()
  const originalOpen = window.XMLHttpRequest.prototype.open
  window.XMLHttpRequest.prototype.open = function open (method, url, ...rest: any[]): void {
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

    // @ts-expect-error rest
    originalOpen.call(this, method, url, ...rest)
  }

  return requestTracker
}

export default createXmlHttpRequestTracker
