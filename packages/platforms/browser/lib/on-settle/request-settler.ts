import { type Clock } from '@bugsnag/core-performance'
import { Settler } from './settler'
import {
  type RequestStartContext,
  type RequestEndContext,
  type RequestTracker
} from '@bugsnag/request-tracker-performance'

class RequestSettler extends Settler {
  private timeout: ReturnType<typeof setTimeout> | undefined = undefined
  private urlsToIgnore: RegExp[] = []
  private outstandingRequests = 0

  constructor (clock: Clock, requestTracker: RequestTracker) {
    super(clock)

    // unlike most other settlers we start settled as it's possible to not make
    // any requests at all
    // TODO: we actually should only be settled if there are no outstanding
    //       requests when constructed
    this.settled = true

    requestTracker.onStart(this.onRequestStart.bind(this))
  }

  setUrlsToIgnore (urlsToIgnore: RegExp[]): void {
    this.urlsToIgnore = urlsToIgnore
  }

  private onRequestStart (startContext: RequestStartContext) {
    // if this is an excluded URL, ignore this request
    if (this.shouldIgnoreUrl(startContext.url)) return

    clearTimeout(this.timeout)
    this.settled = false
    ++this.outstandingRequests

    return {
      onRequestEnd: (endContext: RequestEndContext): void => {
        if (--this.outstandingRequests === 0) {
          // we wait 100ms to ensure that requests have actually stopped but don't
          // want the settled time to reflect that wait, so we record the time
          // here and use that when settling
          const settledTime = this.clock.now()

          this.timeout = setTimeout(() => { this.settle(settledTime) }, 100)
        }
      }
    }
  }

  private shouldIgnoreUrl (url: string): boolean {
    return this.urlsToIgnore.some(regexp => regexp.test(url))
  }
}

export default RequestSettler
