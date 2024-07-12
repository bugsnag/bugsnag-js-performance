import type { Clock } from '@bugsnag/core-performance'
import type { RequestStartContext } from './request-tracker'
import { RequestTracker } from './request-tracker'
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

function isHeadersInstance (input: unknown): input is Headers {
  return !!input && typeof input === 'object' && input instanceof Headers
}

function createFetchRequestTracker (global: GlobalWithFetch, clock: Clock) {
  const requestTracker = new RequestTracker()
  const originalFetch = global.fetch

  global.fetch = function fetch (input: unknown, init?: unknown) {
    const startContext = createStartContext(clock.now(), input, init, global.document && global.document.baseURI)

    const { onRequestEnd, extraRequestHeaders } = requestTracker.start(startContext)

    // Add the headers to the `init` received from the caller
    const modifiedParams = mergeRequestHeaders(input as RequestInfo, init as RequestInit, extraRequestHeaders)

    return originalFetch.call(this, modifiedParams[0], modifiedParams[1]).then(response => {
      onRequestEnd({ status: response.status, endTime: clock.now(), state: 'success' })
      return response
    }).catch(error => {
      onRequestEnd({ error, endTime: clock.now(), state: 'error' })
      throw error
    })
  }

  return requestTracker
}

function mergeRequestHeaders (input: RequestInfo, init?: RequestInit, extraRequestHeaders?: Array<Record<string, string>>): Parameters<typeof fetch> {
  if (!extraRequestHeaders) return [input, init]

  const extraHeaders = extraRequestHeaders.reduce((headers, current) => ({ ...headers, ...current }), {})

  if (isRequest(input) && (!init || !init.headers)) {
    mergeInputRequestHeaders(extraHeaders, input)
  } else {
    init = mergeInitRequestHeaders(extraHeaders, init)
  }

  return [input, init]
}

function mergeInputRequestHeaders (extraRequestHeaders: Record<string, string>, input: Request) {
  for (const [name, value] of Object.entries(extraRequestHeaders)) {
    if (!input.headers.has(name)) {
      input.headers.set(name, value)
    }
  }
}

function mergeInitRequestHeaders (extraRequestHeaders: Record<string, string>, init?: RequestInit): RequestInit {
  if (!init) init = {}

  if (isHeadersInstance(init.headers)) {
    for (const [name, value] of Object.entries(extraRequestHeaders)) {
      if (!init.headers.has(name)) {
        init.headers.set(name, value)
      }
    }

    return init
  } else {
    return { ...init, headers: { ...extraRequestHeaders, ...init.headers } }
  }
}

export default createFetchRequestTracker
