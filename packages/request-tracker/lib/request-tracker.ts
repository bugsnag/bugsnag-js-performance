export interface RequestStartContext {
  url: string
  method: string
  startTime: number
  type: 'fetch' | 'xmlhttprequest'
}

export interface RequestEndContextSuccess {
  endTime: number
  status: number
  state: 'success'
}

export interface RequestEndContextError {
  endTime: number
  state: 'error'
  error?: Error
}

export type RequestEndContext = RequestEndContextSuccess | RequestEndContextError

export type RequestStartCallback = (context: RequestStartContext) => { onRequestEnd: RequestEndCallback, extraRequestHeaders?: Record<string, string> } | undefined

export type RequestEndCallback = (context: RequestEndContext) => void

export class RequestTracker {
  private callbacks: RequestStartCallback[] = []

  onStart (startCallback: RequestStartCallback) {
    this.callbacks.push(startCallback)
  }

  start (context: RequestStartContext) {
    const results: Array<ReturnType<RequestStartCallback>> = []
    for (const startCallback of this.callbacks) {
      const result = startCallback(context)
      if (result) results.push(result)
    }

    return {
      onRequestEnd: (endContext: RequestEndContext) => {
        for (const result of results) {
          result?.onRequestEnd(endContext)
        }
      },
      extraRequestHeaders: results.map(result => result?.extraRequestHeaders)
    }
  }
}
