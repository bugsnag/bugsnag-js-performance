import { type Settler } from './settler'
import {
  type RequestStartContext,
  type RequestEndCallback,
  type RequestEndContext,
  type RequestTracker
} from '../request-tracker/request-tracker'

class RequestSettler implements Settler {
  // unlike most other settlers we start settled as it's possible to not make
  // any requests at all
  // TODO: we actually should only be settled if there are no outstanding
  //       requests when constructed
  private settled: boolean = true
  private callbacks: Array<() => void> = []
  private timeout: ReturnType<typeof setTimeout> | undefined = undefined
  private outstandingRequests = 0

  constructor (requestTracker: RequestTracker) {
    requestTracker.onStart(this.onRequestStart.bind(this))
  }

  subscribe (callback: () => void): void {
    this.callbacks.push(callback)

    // if we're already settled, call the callback immediately
    if (this.settled) {
      callback()
    }
  }

  private onRequestStart (startContext: RequestStartContext): RequestEndCallback {
    clearTimeout(this.timeout)
    this.settled = false
    ++this.outstandingRequests

    return (endContext: RequestEndContext): void => {
      if (--this.outstandingRequests === 0) {
        this.timeout = setTimeout(() => { this.settle() }, 100)
      }
    }
  }

  private settle () {
    this.settled = true

    for (const callback of this.callbacks) {
      callback()
    }
  }
}

export default RequestSettler
