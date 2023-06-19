import type { SpanFactory } from '@bugsnag/core-performance'

function shouldOmitSpan (startTime: number, endTime: number) {
  return startTime === 0 && endTime === 0
}

export const pageLoadPhaseSpans = (spanFactory: SpanFactory, route: string, performance: Performance) => {
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  const { startSpan, endSpan } = spanFactory

  if (entry) {
    if (!shouldOmitSpan(entry.unloadEventStart, entry.unloadEventEnd)) {
      endSpan(startSpan('[PageLoadPhase/Unload]' + route, {
        startTime: entry.unloadEventStart
      }), entry.unloadEventEnd)
    }

    if (entry.redirectStart && !shouldOmitSpan(entry.redirectStart, entry.redirectEnd)) {
      endSpan(startSpan('[PageLoadPhase/Redirect]' + route, {
        startTime: entry.redirectStart
      }), entry.redirectEnd)
    }

    if (!shouldOmitSpan(entry.fetchStart, entry.domainLookupStart)) {
      endSpan(startSpan('[PageLoadPhase/LoadFromCache]' + route, {
        startTime: entry.fetchStart
      }), entry.domainLookupStart)
    }

    if (!shouldOmitSpan(entry.domainLookupStart, entry.domainLookupEnd)) {
      endSpan(startSpan('[PageLoadPhase/DNSLookup]' + route, {
        startTime: entry.domainLookupStart
      }), entry.domainLookupEnd)
    }

    const TCPHandshakeEnd = Math.min(entry.connectEnd, entry.secureConnectionStart)
    if (!shouldOmitSpan(entry.connectStart, TCPHandshakeEnd)) {
      endSpan(startSpan('[PageLoadPhase/TCPHandshake]' + route, {
        startTime: entry.connectStart
      }), TCPHandshakeEnd)
    }

    if (!shouldOmitSpan(entry.secureConnectionStart, entry.connectEnd)) {
      endSpan(startSpan('[PageLoadPhase/TLS]' + route, {
        startTime: entry.secureConnectionStart
      }), entry.connectEnd)
    }

    if (!shouldOmitSpan(entry.requestStart, entry.responseStart)) {
      endSpan(startSpan('[PageLoadPhase/HTTPRequest]' + route, {
        startTime: entry.requestStart
      }), entry.responseStart)
    }

    if (!shouldOmitSpan(entry.responseStart, entry.responseEnd)) {
      endSpan(startSpan('[PageLoadPhase/HTTPResponse]' + route, {
        startTime: entry.responseStart
      }), entry.responseEnd)
    }

    if (!shouldOmitSpan(entry.domContentLoadedEventStart, entry.domContentLoadedEventEnd)) {
      endSpan(startSpan('[PageLoadPhase/DomContentLoadedEvent]' + route, {
        startTime: entry.domContentLoadedEventStart
      }), entry.domContentLoadedEventEnd)
    }

    if (!shouldOmitSpan(entry.loadEventStart, entry.loadEventEnd)) {
      endSpan(startSpan('[PageLoadPhase/LoadEvent]' + route, {
        startTime: entry.loadEventStart
      }), entry.loadEventEnd)
    }
  }
}
