import { type SpanInternal } from '@bugsnag/js-performance-core'

export interface PerformanceWithTiming {
  timing: {
    responseStart: number
    navigationStart: number
  }
}

function isPerformanceNavigationTiming (entry: PerformanceEntry): entry is PerformanceNavigationTiming {
  return entry.entryType === 'navigation'
}

export class WebVitalsTracker {
  timeToFirstByte?: number = undefined
  firstContentfulPaint?: number = undefined

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
    new PerformanceObserverClass((list, observer) => {
      for (const entry of list.getEntries()) {
        // we don't really _need_ to check 'isPerformanceNavigationTiming' here
        // as we only observe entries with type === 'navigation' anyway, but
        // this makes TypeScript happy :)
        if (isPerformanceNavigationTiming(entry) && entry.responseStart > 0) {
          // Set TTFB
          this.timeToFirstByte = entry.responseStart

          // the ttfb event can only happen once per-page, so we don't need to
          // keep observing
          observer.disconnect()

          // once we've found an entry with a valid responseStart we can stop
          break
        }
      }
    }).observe({ type: 'navigation', buffered: true })

    // TODO: The API will dispatch a first-contentful-paint entry for pages loaded in a background tab,
    // but those pages should be ignored when calculating FCP (first paint timings should only
    // be considered if the page was in the foreground the entire time).
    //
    // TODO: The API does not report first-contentful-paint entries when the page is restored from the
    // back/forward cache, but FCP should be measured in these cases since users experience them
    // as distinct page visits.
    //
    // TODO: The API may not report paint timings from cross-origin iframes, but to properly measure
    // FCP you should consider all frames. Sub-frames can use the API to report their paint
    // timings to the parent frame for aggregation.
    new PerformanceObserverClass((list, observer) => {
      for (const entry of list.getEntriesByName('first-contentful-paint')) {
        if (entry.startTime > 0) {
          this.firstContentfulPaint = entry.startTime
          observer.disconnect()
          break
        }
      }
    }).observe({ type: 'paint', buffered: true })
  }

  private observeUsingPerformanceTiming (performance: PerformanceWithTiming) {
    const setOnValidResponseStart = () => {
    // 'responseStart' will be 0 until it has a valid value

      if (performance.timing.responseStart > 0) {
        this.timeToFirstByte = performance.timing.responseStart - performance.timing.navigationStart
      } else {
      // check responseStart on the next frame if it's not available yet
        requestAnimationFrame(setOnValidResponseStart)
      }
    }

    setOnValidResponseStart()
  }

  attachTo (span: SpanInternal) {
    if (this.firstContentfulPaint) {
      span.addEvent('fcp', this.firstContentfulPaint)
    }
    if (this.timeToFirstByte) {
      span.addEvent('ttfb', this.timeToFirstByte)
    }
  }
}
