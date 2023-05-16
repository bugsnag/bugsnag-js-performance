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
    const firstContentfulPaint = this.firstContentfulPaint()

    if (firstContentfulPaint) {
      span.addEvent('fcp', firstContentfulPaint)
    }

    const timeToFirstByte = this.timeToFirstByte()

    if (timeToFirstByte) {
      span.addEvent('ttfb', timeToFirstByte)
    }
  }

  // While listed as supported, chrome 61 returns an empty array when using performance.getEntriesByName
  // with 'first-contentful-paint', but getting entries by type 'paint' returns the expected entry
  private firstContentfulPaint () {
    const entry = this.performance.getEntriesByType('paint').filter(({ name }) => name === 'first-contentful-paint')[0]

    if (entry) {
      return entry.startTime
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
