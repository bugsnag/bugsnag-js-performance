import EventEmitter from './event-emitter'

export interface FetchRequestData {
  state: 'start' | 'end'
  url: string
  method: string
  startTime: Date
  endTime?: Date
  status?: number
  error?: Error
}

interface WindowWithFetch {
  fetch: typeof fetch
}

let eventEmitter: EventEmitter<FetchRequestData> | undefined

const init = (win: WindowWithFetch = window) => new EventEmitter<FetchRequestData>(() => {
  const originalFetch = win.fetch
  win.fetch = function fetch (input: RequestInfo | URL, init?: RequestInit) {
    const context = onFetchStart(input, init)
    return originalFetch.call(this, input, init).then(response => {
      onFetchEnd(context, response)
      return response
    }).catch(error => {
      onFetchEnd(context, undefined, error)
      throw error
    })
  }

  function uninitalise () {
    win.fetch = originalFetch
  }

  return uninitalise
})

function onFetchStart (input: RequestInfo | URL, init?: RequestInit): FetchRequestData {
  const inputIsRequest = isRequest(input)
  const url = inputIsRequest ? input.url : input && String(input)
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  const method = (init && init.method) || (inputIsRequest && input.method) || 'GET'
  const context: FetchRequestData = {
    url,
    method,
    state: 'start',
    startTime: new Date()
  }

  eventEmitter?.emit(context)
  return context
}

function onFetchEnd (context: FetchRequestData, response?: Response, error?: Error) {
  context.endTime = new Date()
  context.status = response?.status
  context.state = 'end'
  context.error = error
  eventEmitter?.emit(context)
}

function isRequest (input: RequestInfo | URL): input is Request {
  return input !== null && typeof input === 'object' && !(input instanceof URL)
}

export function initFetchEventEmitter (window?: WindowWithFetch) {
  if (!eventEmitter) eventEmitter = init(window)
  return eventEmitter
}
