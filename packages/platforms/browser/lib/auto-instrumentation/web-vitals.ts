function isPerformanceNavigationTiming (entry: PerformanceEntry): entry is PerformanceNavigationTiming {
  return entry.entryType === 'navigation'
}

export class WebVitalsTracker {
  ttfb = 0

  constructor (PerformanceObserverClass: typeof PerformanceObserver) {
    const observer = new PerformanceObserverClass((list) => {
      for (const entry of list.getEntries()) {
        if (isPerformanceNavigationTiming(entry) && entry.responseStart > 0) {
          this.ttfb = entry.responseStart
          observer.disconnect()
          break
        }
      }
    })

    observer.observe({ entryTypes: ['navigation'] })
  }
}
