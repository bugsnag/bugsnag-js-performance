export interface RequestStartContext {
  url: string
  method: string
  startTime: number
}

export interface RequestEndContextSuccess { endTime: number, status: number }
export interface RequestEndContextError { endTime: number, error: Error }

export type RequestEndContext = RequestEndContextSuccess | RequestEndContextError

export type RequestStartCallback = (context: RequestStartContext) => RequestEndCallback | undefined
export type RequestEndCallback = (context: RequestEndContext) => void

export class RequestTracker {
  private callbacks: RequestStartCallback[] = []

  onStart (startCallback: RequestStartCallback) {
    this.callbacks.push(startCallback)
  }

  start (context: RequestStartContext) {
    const endCallbacks: RequestEndCallback[] = []
    for (const startCallback of this.callbacks) {
      const endCallback = startCallback(context)
      if (endCallback) endCallbacks.push(endCallback)
    }

    return (endContext: RequestEndContext) => {
      for (const endCallback of endCallbacks) {
        endCallback(endContext)
      }
    }
  }
}
