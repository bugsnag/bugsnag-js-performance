// the 'PerformanceNavigationTiming' interface, with only the timing values
// i.e. this doesn't contain properties like 'encodedBodySize'
export interface PerformanceTimingData {
  readonly connectStart: number
  readonly connectEnd: number
  readonly domainLookupStart: number
  readonly domainLookupEnd: number
  readonly domComplete: number
  readonly domContentLoadedEventStart: number
  readonly domContentLoadedEventEnd: number
  readonly domInteractive: number
  readonly fetchStart: number
  readonly loadEventStart: number
  readonly loadEventEnd: number
  readonly redirectStart: number
  readonly redirectEnd: number
  readonly responseStart: number
  readonly responseEnd: number
  readonly requestStart: number
  readonly secureConnectionStart: number
  readonly unloadEventStart: number
  readonly unloadEventEnd: number
  // workerStart is not present in the deprecated PerformanceTiming API
  readonly workerStart?: number
}

interface PerformanceWithTiming {
  timing: PerformanceTiming
}

// check if a PerformanceEntry is a PerformanceNavigationTiming
function isPerformanceNavigationTiming (entry: PerformanceEntry): entry is PerformanceNavigationTiming {
  return entry.entryType === 'navigation'
}

type PerformanceTimingDataGetter = () => Promise<PerformanceTimingData>

function createPerformanceTimingSource (
  PerformanceObserverClass: typeof PerformanceObserver,
  performance: PerformanceWithTiming
): PerformanceTimingDataGetter {
  const supportedEntryTypes = PerformanceObserverClass.supportedEntryTypes

  // if the browser doesn't support 'supportedEntryTypes' or doesn't support
  // the 'navigation' entry type, we can't use PerformanceObserver to listen
  // for 'navigation' entries so have to fall back to polling the deprecated
  // 'performance.timing' object
  if (Array.isArray(supportedEntryTypes) && supportedEntryTypes.includes('navigation')) {
    return usingPerformanceObserver(PerformanceObserverClass)
  }

  return usingPerformanceNavigationTiming(performance)
}

function usingPerformanceObserver (
  PerformanceObserverClass: typeof PerformanceObserver
): PerformanceTimingDataGetter {
  return function getPerformanceTimingData (): Promise<PerformanceTimingData> {
    return new Promise(resolve => {
      const observer = new PerformanceObserverClass(list => {
        for (const entry of list.getEntries()) {
          // we don't really _need_ to check 'isPerformanceNavigationTiming' here
          // as we only observe entries with type === 'navigation' anyway, but
          // this makes TypeScript happy :)
          if (isPerformanceNavigationTiming(entry) && entry.loadEventEnd > 0) {
            resolve(entry)

            // this can only happen once per-page, so we don't need to keep
            // observing
            observer.disconnect()

            // once we've found an entry with a valid loadEventEnd we can stop
            // in practice there doesn't seem to be multiple navigation entries
            // anyway, but it doesn't hurt to break here just in case
            break
          }
        }
      })

      observer.observe({ type: 'navigation', buffered: true })
    })
  }
}

function usingPerformanceNavigationTiming (
  performance: PerformanceWithTiming
): PerformanceTimingDataGetter {
  return function getPerformanceNavigationTimingEntry () {
    return new Promise(resolve => {
      const resolveOnValidLoadEventEnd = () => {
        // 'loadEventEnd' will be 0 until it has a valid value
        if (performance.timing.loadEventEnd > 0) {
          resolve(normalisePerformanceTiming(performance.timing))
        } else {
          // check loadEventEnd on the next frame if it's not available yet
          requestAnimationFrame(resolveOnValidLoadEventEnd)
        }
      }

      resolveOnValidLoadEventEnd()
    })
  }
}

function normalisePerformanceTiming (timing: PerformanceTiming): PerformanceTimingData {
  const normalise = (value: number): number => Math.max(value - timing.navigationStart, 0)

  return {
    connectStart: normalise(timing.connectStart),
    connectEnd: normalise(timing.connectEnd),
    domainLookupStart: normalise(timing.domainLookupStart),
    domainLookupEnd: normalise(timing.domainLookupEnd),
    domComplete: normalise(timing.domComplete),
    domContentLoadedEventStart: normalise(timing.domContentLoadedEventStart),
    domContentLoadedEventEnd: normalise(timing.domContentLoadedEventEnd),
    domInteractive: normalise(timing.domInteractive),
    fetchStart: normalise(timing.fetchStart),
    loadEventStart: normalise(timing.loadEventStart),
    loadEventEnd: normalise(timing.loadEventEnd),
    redirectStart: normalise(timing.redirectStart),
    redirectEnd: normalise(timing.redirectEnd),
    responseStart: normalise(timing.responseStart),
    responseEnd: normalise(timing.responseEnd),
    requestStart: normalise(timing.requestStart),
    secureConnectionStart: normalise(timing.secureConnectionStart),
    unloadEventStart: normalise(timing.unloadEventStart),
    unloadEventEnd: normalise(timing.unloadEventEnd)
  }
}

export default createPerformanceTimingSource
