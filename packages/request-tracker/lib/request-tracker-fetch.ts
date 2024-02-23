import { type Clock } from '@bugsnag/core-performance'
import { type RequestStartContext, RequestTracker } from './request-tracker'
import getAbsoluteUrl from './url-helpers'

interface GlobalWithFetch {
  fetch: typeof fetch
  document?: Document
}

function createStartContext (startTime: number, input: unknown, init?: unknown, baseUrl?: string): RequestStartContext {
  const inputIsRequest = isRequest(input)
  const url = inputIsRequest ? input.url : String(input)
  const method = (!!init && (init as RequestInit).method) || (inputIsRequest && input.method) || 'GET'
  return { url: getAbsoluteUrl(url, baseUrl), method, startTime, type: 'fetch' }
}

function isRequest (input: unknown): input is Request {
  return !!input && typeof input === 'object' && !(input instanceof URL)
}

function createFetchRequestTracker (global: GlobalWithFetch, clock: Clock) {
  const requestTracker = new RequestTracker()
  const originalFetch = global.fetch

  global.fetch = function fetch (input?: unknown, init?: unknown) {
    const startContext = createStartContext(clock.now(), input, init, global.document && global.document.baseURI)
    const { onRequestEnd } = requestTracker.start(startContext)

    return originalFetch.call(this, input as RequestInfo, init as RequestInit).then(response => {
      onRequestEnd({ status: response.status, endTime: clock.now(), state: 'success' })
      return response
    }).catch(error => {
      onRequestEnd({ error, endTime: clock.now(), state: 'error' })
      throw error
    })
  }

  return requestTracker
}

export default createFetchRequestTracker
