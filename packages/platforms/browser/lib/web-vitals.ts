import type { Clock, SpanInternal } from '@bugsnag/core-performance'

interface PerformanceWithNavigationTiming {
  getEntriesByName: typeof performance.getEntriesByName
  getEntriesByType: typeof performance.getEntriesByType
  timing: {
    responseStart: number
    navigationStart: number
  }
}

// layout shifts are grouped into "session windows", which is defined as a set
// of layout shifts that occur with less than 1 second between each shift and a
// maximum of 5 seconds total duration
// see the web vitals definition:
// https://web.dev/evolving-cls/#why-a-session-window
interface LayoutShiftSession {
  value: number
  readonly firstStartTime: number
  previousStartTime: number
}

// https://wicg.github.io/layout-instability/#sec-layout-shift
interface LayoutShift extends PerformanceEntry {
  entryType: 'layout-shift'
  value: number
  hadRecentInput: boolean
  lastInputTime: number
}

export class WebVitals {
  private readonly performance: PerformanceWithNavigationTiming
  private readonly clock: Clock
  private readonly observers: PerformanceObserver[]

  private largestContentfulPaint: number | undefined
  private cumulativeLayoutShift: number | undefined

  constructor (
    performance: PerformanceWithNavigationTiming,
    clock: Clock,
    PerformanceObserverClass?: typeof PerformanceObserver
  ) {
    this.performance = performance
    this.clock = clock
    this.observers = []

    if (PerformanceObserverClass && Array.isArray(PerformanceObserverClass.supportedEntryTypes)) {
      const supportedEntryTypes = PerformanceObserverClass.supportedEntryTypes

      if (supportedEntryTypes.includes('largest-contentful-paint')) {
        this.observeLargestContentfulPaint(PerformanceObserverClass)
      }

      if (supportedEntryTypes.includes('layout-shift')) {
        this.observeLayoutShift(PerformanceObserverClass)
      }
    }
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

    const firstInputDelay = this.firstInputDelay()

    if (firstInputDelay) {
      span.addEvent('fid_start', firstInputDelay.start)
      span.addEvent('fid_end', firstInputDelay.end)
    }

    if (this.cumulativeLayoutShift) {
      span.setAttribute('bugsnag.metrics.cls', this.cumulativeLayoutShift)
    }

    if (this.largestContentfulPaint) {
      span.addEvent('lcp', this.largestContentfulPaint)
    }

    // as there is only 1 page load span, we don't need to keep observing
    // performance events, so can disconnect from any observers we've registered
    for (const observer of this.observers) {
      observer.disconnect()
    }
  }

  private firstContentfulPaint () {
    const entries = this.performance.getEntriesByName('first-contentful-paint', 'paint')
    const entry = Array.isArray(entries) && entries[0]

    if (entry) {
      return entry.startTime
    }
  }

  private timeToFirstByte () {
    const entries = this.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    const entry = Array.isArray(entries) && entries[0]

    let responseStart: number

    if (entry) {
      responseStart = entry.responseStart
    } else {
      responseStart = this.performance.timing.responseStart - this.performance.timing.navigationStart
    }

    // only use responseStart if it's valid (between 0 and the current time)
    // any other value cannot be valid because it would mean the response
    // started immediately or hasn't happened yet!
    if (responseStart > 0 && responseStart <= this.clock.now()) {
      return responseStart
    }
  }

  private firstInputDelay () {
    const entries = this.performance.getEntriesByType('first-input') as PerformanceEventTiming[]
    const entry = Array.isArray(entries) && entries[0]

    if (entry) {
      return {
        start: entry.startTime,
        end: entry.processingStart
      }
    }
  }

  private observeLargestContentfulPaint (
    PerformanceObserverClass: typeof PerformanceObserver
  ): void {
    const observer = new PerformanceObserverClass((list) => {
      const entries = list.getEntries()

      if (entries.length > 0) {
        // Use the latest LCP candidate
        this.largestContentfulPaint = entries[entries.length - 1].startTime
      }
    })

    observer.observe({ type: 'largest-contentful-paint', buffered: true })

    this.observers.push(observer)
  }

  private observeLayoutShift (
    PerformanceObserverClass: typeof PerformanceObserver
  ): void {
    let session: LayoutShiftSession | undefined

    const observer = new PerformanceObserverClass((list) => {
      for (const entry of list.getEntries() as LayoutShift[]) {
        // ignore entries with recent input as it's likely the layout shifted due
        // to user input and this metric only cares about unexpected layout
        // shifts
        if (entry.hadRecentInput) {
          continue
        }

        // include this entry in the current session if we have a current session
        // and this entry fits into the session window (it occurred less than 1
        // second after the previous entry and the session duration is less than
        // 5 seconds), otherwise start a new session
        if (
          session &&
          entry.startTime - session.previousStartTime < 1000 &&
          entry.startTime - session.firstStartTime < 5000
        ) {
          session.value += entry.value
          session.previousStartTime = entry.startTime
        } else {
          session = {
            value: entry.value,
            firstStartTime: entry.startTime,
            previousStartTime: entry.startTime
          }
        }
      }

      if (session &&
        (this.cumulativeLayoutShift === undefined || session.value > this.cumulativeLayoutShift)
      ) {
        this.cumulativeLayoutShift = session.value
      }
    })

    observer.observe({ type: 'layout-shift', buffered: true })

    this.observers.push(observer)
  }
}
