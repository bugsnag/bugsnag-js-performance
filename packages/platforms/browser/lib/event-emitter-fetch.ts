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

let eventEmitter: EventEmitter<FetchRequestData> | undefined

const init = (global: Window & typeof globalThis = window) => new EventEmitter<FetchRequestData>(() => {
  const originalFetch = global.fetch
  global.fetch = function fetch (input: RequestInfo | URL, init?: RequestInit) {
    const context = onFetchStart(input, init)
    return originalFetch.call(this, input, init).then(response => {
      onFetchEnd(context, response)
      return response
    }).catch(error => {
      onFetchEnd(context, undefined, error)
      throw error
    })
  }

  function uninitalize () {
    global.fetch = originalFetch
  }

  return uninitalize
})

function onFetchStart (input: RequestInfo | URL, init?: RequestInit): FetchRequestData {
  const inputIsRequest = typeof input === 'object' && !(input instanceof URL)
  const method = init?.method || (inputIsRequest && (input as Request)?.method) || 'GET'
  const url = input && (inputIsRequest ? (input as Request)?.url : String(input))
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

export function initFetchEventEmitter (global?: Window & typeof globalThis) {
  if (!eventEmitter) eventEmitter = init(global)
  return eventEmitter
}
