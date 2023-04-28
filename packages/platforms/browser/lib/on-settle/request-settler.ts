import { Settler } from './settler'
import {
  type RequestStartContext,
  type RequestEndCallback,
  type RequestEndContext,
  type RequestTracker
} from '../request-tracker/request-tracker'

class RequestSettler extends Settler {
  private timeout: ReturnType<typeof setTimeout> | undefined = undefined
  private outstandingRequests = 0

  constructor (requestTracker: RequestTracker) {
    super()

    // unlike most other settlers we start settled as it's possible to not make
    // any requests at all
    // TODO: we actually should only be settled if there are no outstanding
    //       requests when constructed
    this.settled = true

    requestTracker.onStart(this.onRequestStart.bind(this))
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
}

export default RequestSettler
