import { type Clock } from '@bugsnag/js-performance-core'
import { type RequestStartContext, RequestTracker } from './request-tracker'
import getAbsoluteUrl from '../utils/url'

interface WindowWithFetch {
  fetch: typeof fetch
  location: Location
}

function createStartContext (pageUrl: string, startTime: number, input: unknown, init?: unknown): RequestStartContext {
  const inputIsRequest = isRequest(input)
  const url = inputIsRequest ? input.url : String(input)
  const method = (!!init && (init as RequestInit).method) || (inputIsRequest && input.method) || 'GET'
  return { url: getAbsoluteUrl(url, pageUrl), method, startTime }
}

function isRequest (input: unknown): input is Request {
  return !!input && typeof input === 'object' && !(input instanceof URL)
}

function createFetchRequestTracker (window: WindowWithFetch, clock: Clock) {
  const requestTracker = new RequestTracker()
  const originalFetch = window.fetch

  window.fetch = function fetch (input?: unknown, init?: unknown) {
    const startContext = createStartContext(window.location.href, clock.now(), input, init)
    const onRequestEnd = requestTracker.start(startContext)

    return originalFetch.call(this, input as RequestInfo | URL, init as RequestInit).then(response => {
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
