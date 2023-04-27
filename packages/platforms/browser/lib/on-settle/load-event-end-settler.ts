import { type Settler } from './settler'

// check if a PerformanceEntry is a PerformanceNavigationTiming
function isPerformanceNavigationTiming (entry: PerformanceEntry): entry is PerformanceNavigationTiming {
  return entry.entryType === 'navigation'
}

class LoadEventEndSettler implements Settler {
  private settled: boolean = false
  private callbacks: Array<() => void> = []

  constructor (PerformanceObserverClass: typeof PerformanceObserver) {
    const observer = new PerformanceObserverClass(list => {
      for (const entry of list.getEntries()) {
        // we don't really _need_ to check 'isPerformanceNavigationTiming' here
        // as we only observe entries with type === 'navigation' anyway, but
        // this makes TypeScript happy :)
        if (isPerformanceNavigationTiming(entry) && entry.loadEventEnd > 0) {
          this.settled = true

          for (const callback of this.callbacks) {
            callback()
          }

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

  subscribe (callback: () => void): void {
    this.callbacks.push(callback)

    // if we're already settled, call the callback immediately
    if (this.settled) {
      callback()
    }
  }
}

export default LoadEventEndSettler
