import { type Settler } from './settler'

interface PerformanceWithTiming {
  timing: {
    loadEventEnd: number
  }
}

// check if a PerformanceEntry is a PerformanceNavigationTiming
function isPerformanceNavigationTiming (entry: PerformanceEntry): entry is PerformanceNavigationTiming {
  return entry.entryType === 'navigation'
}

class LoadEventEndSettler implements Settler {
  private settled: boolean = false
  private callbacks: Array<() => void> = []

  constructor (PerformanceObserverClass: typeof PerformanceObserver, performance: PerformanceWithTiming) {
    const supportedEntryTypes = PerformanceObserverClass.supportedEntryTypes

    // if the browser doesn't support 'supportedEntryTypes' or doesn't support
    // the 'navigation' entry type, we can't use PerformanceObserver to listen
    // for 'navigation' entries so have to fall back to polling the deprecated
    // 'performance.timing' object
    if (Array.isArray(supportedEntryTypes) && supportedEntryTypes.includes('navigation')) {
      this.settleUsingPerformanceObserver(PerformanceObserverClass)
    } else {
      this.settleUsingPerformanceTiming(performance)
    }
  }

  subscribe (callback: () => void): void {
    this.callbacks.push(callback)

    // if we're already settled, call the callback immediately
    if (this.settled) {
      callback()
    }
  }

  private settleUsingPerformanceObserver (PerformanceObserverClass: typeof PerformanceObserver): void {
    const observer = new PerformanceObserverClass(list => {
      for (const entry of list.getEntries()) {
        // we don't really _need_ to check 'isPerformanceNavigationTiming' here
        // as we only observe entries with type === 'navigation' anyway, but
        // this makes TypeScript happy :)
        if (isPerformanceNavigationTiming(entry) && entry.loadEventEnd > 0) {
          this.settle()

          // the load event can only happen once per-page, so we don't need to
          // keep observing
          observer.disconnect()

          // once we've found an entry with a valid loadEventEnd we can stop
          // in practice this seems to always be the last entry in the list as
          // loadEventEnd is the last value in the navigation timeline, but it
          // doesn't hurt to break here anyway
          break
        }
      }
    })

    observer.observe({ type: 'navigation', buffered: true })
  }

  private settleUsingPerformanceTiming (performance: PerformanceWithTiming): void {
    const settleOnValidLoadEventEnd = () => {
      // 'loadEventEnd' will be 0 until it has a valid value
      if (performance.timing.loadEventEnd > 0) {
        this.settle()
      } else {
        // check loadEventEnd on the next frame if it's not available yet
        requestAnimationFrame(settleOnValidLoadEventEnd)
      }
    }

    settleOnValidLoadEventEnd()
  }

  private settle (): void {
    this.settled = true

    for (const callback of this.callbacks) {
      callback()
    }
  }
}

export default LoadEventEndSettler
