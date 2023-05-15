import { type SpanInternal } from '@bugsnag/js-performance-core'

interface PerformanceWithNavigationTiming {
  getEntriesByType: typeof performance.getEntriesByType
  timing: {
    responseStart: number
    navigationStart: number
  }
}

export class WebVitals {
  private performance: PerformanceWithNavigationTiming

  constructor (performance: PerformanceWithNavigationTiming) {
    this.performance = performance
  }

  attachTo (span: SpanInternal) {
    const timeToFirstByte = this.timeToFirstByte()

    if (timeToFirstByte) {
      span.addEvent('ttfb', timeToFirstByte)
    }
  }

  private timeToFirstByte () {
    const entry = this.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    if (entry) {
      return entry.responseStart
    }

    // fallback for old browsers that don't support the 'navigation' entryType
    return Math.max(
      this.performance.timing.responseStart - this.performance.timing.navigationStart,
      0
    )
  }
}
