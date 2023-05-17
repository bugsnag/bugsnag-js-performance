import { type Clock } from '@bugsnag/js-performance-core'
import { type RequestEndCallback, type RequestEndContext, RequestTracker } from './request-tracker'

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

    this.addEventListener('readystatechange', () => {
      if (this.readyState === window.XMLHttpRequest.DONE && onRequestEnd) {
        // If the status is 0 the request did not complete so report this as an error
        const endContext: RequestEndContext = this.status > 0
          ? { endTime: clock.now(), status: this.status, state: 'success' }
          : { endTime: clock.now(), state: 'error' }

        onRequestEnd(endContext)
      }
    })

    // @ts-expect-error rest
    originalOpen.call(this, method, url, ...rest)
  }

  return requestTracker
}

export default createXmlHttpRequestTracker
