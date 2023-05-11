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
  readonly workerStart: number
}

// check if a PerformanceEntry is a PerformanceNavigationTiming
function isPerformanceNavigationTiming (entry: PerformanceEntry): entry is PerformanceNavigationTiming {
  return entry.entryType === 'navigation'
}

type PerformanceTimingDataGetter = () => Promise<PerformanceTimingData>

function createPerformanceTimingSource (
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

export default createPerformanceTimingSource
