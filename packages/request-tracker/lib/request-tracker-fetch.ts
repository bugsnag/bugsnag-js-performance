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

    const { onRequestEnd, extraRequestHeaders } = requestTracker.start(startContext)

    // Add the headers to the `init` received from the caller
    const patchedInit = mergeRequestHeaders(init as RequestInit, extraRequestHeaders)

    return originalFetch.call(this, input as RequestInfo, patchedInit).then(response => {
      onRequestEnd({ status: response.status, endTime: clock.now(), state: 'success' })
      return response
    }).catch(error => {
      onRequestEnd({ error, endTime: clock.now(), state: 'error' })
      throw error
    })
  }

  return requestTracker
}

function mergeRequestHeaders (init: RequestInit, extraRequestHeaders?: Array<Record<string, string>>): RequestInit {
  if (!extraRequestHeaders) return init

  const extraHeaders: Record<string, string> = {}
  for (const h of extraRequestHeaders) {
    for (const [name, value] of Object.entries(h)) {
      extraHeaders[name] = value
    }
  }

  return { ...init, headers: { ...extraHeaders, ...init?.headers } }
}

export default createFetchRequestTracker
