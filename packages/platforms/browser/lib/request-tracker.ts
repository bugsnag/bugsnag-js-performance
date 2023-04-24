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

export interface RequestTracker {
  onStart: (callback: RequestStartCallback) => void
  start: (context: RequestStartContext) => RequestEndCallback
}

export function createRequestTracker (): RequestTracker {
  const callbacks: RequestStartCallback[] = []
  return {
    onStart (startCallback: RequestStartCallback) {
      callbacks.push(startCallback)
    },
    start (context: RequestStartContext) {
      const endCallbacks: RequestEndCallback[] = []
      for (const startCallback of callbacks) {
        endCallbacks.push(startCallback(context))
      }

      return (endContext: RequestEndContext) => {
        for (const endCallback of endCallbacks) {
          endCallback(endContext)
        }
      }
    }
  }
}
