import { type SpanInternal } from '@bugsnag/js-performance-core'

interface PerformanceEntryWithTiming extends PerformanceEntry {
  responseStart: number
}

export class WebVitals {
  private timeToFirstByte () {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceEntryWithTiming

    if (entry) {
      return entry.responseStart
    }

    // fallback for old browsers that don't support the 'navigation' entryType
    return Math.max(
      performance.timing.responseStart - performance.timing.navigationStart,
      0
    )
  }

  attachTo (span: SpanInternal) {
    const timeToFirstByte = this.timeToFirstByte()

    if (timeToFirstByte) {
      span.addEvent('ttfb', timeToFirstByte)
    }
  }
}
