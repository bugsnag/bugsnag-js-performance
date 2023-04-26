export interface RequestStartContext {
  url: string
  method: string
  startTime: number
}

interface RequestEndContextSuccess { endTime: number, status: number }
interface RequestEndContextError { endTime: number, error: Error }

type RequestEndContext = RequestEndContextSuccess | RequestEndContextError

export type RequestStartCallback = (context: RequestStartContext) => RequestEndCallback
export type RequestEndCallback = (context: RequestEndContext) => void

export class RequestTracker {
  private callbacks: RequestStartCallback[] = []

  onStart (startCallback: RequestStartCallback) {
    this.callbacks.push(startCallback)
  }

  start (context: RequestStartContext) {
    const endCallbacks: RequestEndCallback[] = []
    for (const startCallback of this.callbacks) {
      endCallbacks.push(startCallback(context))
    }

    return (endContext: RequestEndContext) => {
      for (const endCallback of endCallbacks) {
        endCallback(endContext)
      }
    }
  }
}
