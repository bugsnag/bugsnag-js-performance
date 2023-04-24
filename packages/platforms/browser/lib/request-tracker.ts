
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
  add: (callback: RequestStartCallback) => void
  onStart: (context: RequestStartContext) => RequestEndCallback
}

export function createRequestTracker (): RequestTracker {
  const callbacks: RequestStartCallback[] = []
  return {
    add (startCallback: RequestStartCallback) {
      callbacks.push(startCallback)
    },
    onStart (context: RequestStartContext) {
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
