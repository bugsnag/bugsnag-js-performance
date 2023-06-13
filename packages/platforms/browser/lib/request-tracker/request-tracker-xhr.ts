import { type Clock } from '@bugsnag/core-performance'
import { type RequestEndCallback, type RequestEndContext, RequestTracker } from './request-tracker'
import getAbsoluteUrl from './url-helpers'

interface WindowWithXmlHttpRequest {
  XMLHttpRequest: typeof XMLHttpRequest
  document: Document
}

interface RequestData {
  method: string
  url: string
}

type ReadyStateChangeHandler = (this: XMLHttpRequest, ev: Event) => any

function createXmlHttpRequestTracker (window: WindowWithXmlHttpRequest, clock: Clock): RequestTracker {
  const requestTracker = new RequestTracker()
  const trackedRequests = new WeakMap<XMLHttpRequest, RequestData>()
  const requestHandlers = new WeakMap<XMLHttpRequest, ReadyStateChangeHandler>()

  const originalOpen = window.XMLHttpRequest.prototype.open
  window.XMLHttpRequest.prototype.open = function open (method, url, ...rest: any[]): void {
    trackedRequests.set(this, { method, url: getAbsoluteUrl(String(url), window.document.baseURI) })

    // @ts-expect-error rest
    originalOpen.call(this, method, url, ...rest)
  }

  const originalSend = window.XMLHttpRequest.prototype.send
  window.XMLHttpRequest.prototype.send = function send (body?: Document | XMLHttpRequestBodyInit | null) {
    const requestData = trackedRequests.get(this)
    if (requestData) {
      // if there is an existing event listener this request instance is being reused,
      // so we need to remove the listener from the previous send
      const existingHandler = requestHandlers.get(this)
      if (existingHandler) this.removeEventListener('readystatechange', existingHandler)

      const onRequestEnd: RequestEndCallback = requestTracker.start({
        method: requestData.method,
        url: requestData.url,
        startTime: clock.now()
      })

      const onReadyStateChange: ReadyStateChangeHandler = (evt) => {
        if (this.readyState === window.XMLHttpRequest.DONE && onRequestEnd) {
          // If the status is 0 the request did not complete so report this as an error
          const endContext: RequestEndContext = this.status > 0
            ? { endTime: clock.now(), status: this.status, state: 'success' }
            : { endTime: clock.now(), state: 'error' }

          onRequestEnd(endContext)
        }
      }

      this.addEventListener('readystatechange', onReadyStateChange)
      requestHandlers.set(this, onReadyStateChange)
    }

    originalSend.call(this, body)
  }

  return requestTracker
}

export default createXmlHttpRequestTracker
