import { type Clock } from '@bugsnag/core-performance'
import { type RequestEndContext, RequestTracker } from './request-tracker'
import getAbsoluteUrl from './url-helpers'

interface RequestData {
  method: string
  url: string
}

type ReadyStateChangeHandler = (this: XMLHttpRequest, ev: Event) => any

function createXmlHttpRequestTracker (xhr: typeof XMLHttpRequest, clock: Clock, document?: Document): RequestTracker {
  const requestTracker = new RequestTracker()
  const trackedRequests = new WeakMap<XMLHttpRequest, RequestData>()
  const requestHandlers = new WeakMap<XMLHttpRequest, ReadyStateChangeHandler>()

  const originalOpen = xhr.prototype.open
  xhr.prototype.open = function open (method, url, ...rest: any[]): void {
    trackedRequests.set(this, { method, url: getAbsoluteUrl(String(url), document && document.baseURI) })

    // @ts-expect-error rest
    originalOpen.call(this, method, url, ...rest)
  }

  const originalSend = xhr.prototype.send
  xhr.prototype.send = function send (body?: Document | XMLHttpRequestBodyInit | null) {
    const requestData = trackedRequests.get(this)
    if (requestData) {
      // if there is an existing event listener this request instance is being reused,
      // so we need to remove the listener from the previous send
      const existingHandler = requestHandlers.get(this)
      if (existingHandler) this.removeEventListener('readystatechange', existingHandler)

      const { onRequestEnd } = requestTracker.start({
        type: 'xmlhttprequest',
        method: requestData.method,
        url: requestData.url,
        startTime: clock.now()
      })

      const onReadyStateChange: ReadyStateChangeHandler = (evt) => {
        if (this.readyState === xhr.DONE && onRequestEnd) {
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
