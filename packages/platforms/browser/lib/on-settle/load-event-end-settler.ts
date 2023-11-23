import { type Clock } from '@bugsnag/core-performance'
import { Settler } from './settler'

type AddEventListener = (event: string, callback: () => void) => void

export interface PerformanceWithTiming {
  getEntriesByType: typeof performance.getEntriesByType
  timing: {
    loadEventEnd: number
    navigationStart: number
  }
}

interface DocumentWithReadyState {
  readyState: DocumentReadyState
}

// check if a PerformanceEntry is a PerformanceNavigationTiming
function isPerformanceNavigationTiming (entry?: PerformanceEntry): entry is PerformanceNavigationTiming {
  return !!entry && entry.entryType === 'navigation'
}

class LoadEventEndSettler extends Settler {
  constructor (
    clock: Clock,
    addEventListener: AddEventListener,
    performance: PerformanceWithTiming,
    document: DocumentWithReadyState
  ) {
    super(clock)

    // we delay settling by a macrotask so that the load event has ended
    // see: https://stackoverflow.com/questions/25915634/difference-between-microtask-and-macrotask-within-an-event-loop-context/25933985#25933985
    //      https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/
    if (document.readyState === 'complete') {
      setTimeout(() => { this.settleUsingPerformance(performance) }, 0)
    } else {
      addEventListener('load', () => {
        setTimeout(() => { this.settleUsingPerformance(performance) }, 0)
      })
    }
  }

  private settleUsingPerformance (performance: PerformanceWithTiming) {
    const now = this.clock.now()

    // there's only ever one navigation entry
    // PLAT-10204 Prevent snags occuring due to DOM scanning bots like BuiltWith https://builtwith.com/biup
    const entry = typeof performance.getEntriesByType === 'function' ? performance.getEntriesByType('navigation')[0] : undefined

    let settledTime: number

    if (isPerformanceNavigationTiming(entry)) {
      settledTime = entry.loadEventEnd
    } else if (performance.timing) {
      settledTime = performance.timing.loadEventEnd - performance.timing.navigationStart
    } else {
      settledTime = 0
    }

    // if the settled time is obviously wrong then use the current time instead
    // this won't be a perfectly accurate value, but it should be close enough
    // for this purpose
    if (settledTime <= 0 || settledTime > now) {
      settledTime = now
    }

    this.settle(settledTime)
  }
}

export default LoadEventEndSettler
