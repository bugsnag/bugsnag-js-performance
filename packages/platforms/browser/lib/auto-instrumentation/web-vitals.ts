function isPerformanceNavigationTiming (entry: PerformanceEntry): entry is PerformanceNavigationTiming {
  return entry.entryType === 'navigation'
}

export class WebVitalsManager {
  ttfb = 0

  constructor (PerformanceObserverClass: typeof PerformanceObserver) {
    const observer = new PerformanceObserverClass((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (isPerformanceNavigationTiming(entry) && entry.responseStart > 0) {
          this.ttfb = entry.responseStart
          observer.disconnect()
          break
        }
      }
    })

    observer.observe({ type: 'navigation', buffered: true })
  }
}
