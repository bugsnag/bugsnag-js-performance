export interface PerformanceWithTiming {
  timing: {
    responseStart: number
  }
}

function isPerformanceNavigationTiming (entry: PerformanceEntry): entry is PerformanceNavigationTiming {
  return entry.entryType === 'navigation'
}

export class WebVitalsTracker {
  ttfb = 0

  constructor (PerformanceObserverClass: typeof PerformanceObserver, performance: PerformanceWithTiming) {
    const supportedEntryTypes = PerformanceObserverClass.supportedEntryTypes

    // if the browser doesn't support 'supportedEntryTypes' or doesn't support
    // the 'navigation' entry type, we can't use PerformanceObserver to listen
    // for 'navigation' entries so have to fall back to polling the deprecated
    // 'performance.timing' object
    if (Array.isArray(supportedEntryTypes) && supportedEntryTypes.includes('navigation')) {
      this.observeUsingPerformanceObserver(PerformanceObserverClass)
    } else {
      this.observeUsingPerformanceTiming(performance)
    }
  }

  private observeUsingPerformanceObserver (PerformanceObserverClass: typeof PerformanceObserver) {
    const observer = new PerformanceObserverClass((list) => {
      for (const entry of list.getEntries()) {
        // we don't really _need_ to check 'isPerformanceNavigationTiming' here
        // as we only observe entries with type === 'navigation' anyway, but
        // this makes TypeScript happy :)
        if (isPerformanceNavigationTiming(entry) && entry.responseStart > 0) {
          // Set TTFB
          this.ttfb = entry.responseStart

          // the ttfb event can only happen once per-page, so we don't need to
          // keep observing
          observer.disconnect()

          // once we've found an entry with a valid responseStart we can stop
          break
        }
      }
    })

    observer.observe({ type: 'navigation', buffered: true })
  }

  private observeUsingPerformanceTiming (performance: PerformanceWithTiming) {
    const setOnValidResponseStart = () => {
    // 'responseStart' will be 0 until it has a valid value

      if (performance.timing.responseStart > 0) {
        this.ttfb = performance.timing.responseStart
      } else {
      // check responseStart on the next frame if it's not available yet
        requestAnimationFrame(setOnValidResponseStart)
      }
    }

    setOnValidResponseStart()
  }
}
