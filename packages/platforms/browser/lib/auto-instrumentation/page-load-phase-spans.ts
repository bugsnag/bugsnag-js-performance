import type { SpanFactory } from '@bugsnag/core-performance'
import { type PerformanceWithTiming } from '../on-settle/load-event-end-settler'

function shouldOmitSpan (startTime: number, endTime: number) {
  return startTime === 0 && endTime === 0
}

export const pageLoadPhaseSpans = (spanFactory: SpanFactory, route: string, performance: PerformanceWithTiming) => {
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  if (entry) {
    if (!shouldOmitSpan(entry.unloadEventStart, entry.unloadEventEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/Unload]' + route, {
        startTime: entry.unloadEventStart
      }), entry.unloadEventEnd)
    }

    if (entry.redirectStart && !shouldOmitSpan(entry.redirectStart, entry.redirectEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/Redirect]' + route, {
        startTime: entry.redirectStart
      }), entry.redirectEnd)
    }

    if (!shouldOmitSpan(entry.fetchStart, entry.domainLookupStart)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/LoadFromCache]' + route, {
        startTime: entry.fetchStart
      }), entry.domainLookupStart)
    }

    if (!shouldOmitSpan(entry.domainLookupStart, entry.domainLookupEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/DNSLookup]' + route, {
        startTime: entry.domainLookupStart
      }), entry.domainLookupEnd)
    }

    const TCPHandshakeEnd = Math.min(entry.connectEnd, entry.secureConnectionStart)
    if (!shouldOmitSpan(entry.connectStart, TCPHandshakeEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/TCPHandshake]' + route, {
        startTime: entry.connectStart
      }), TCPHandshakeEnd)
    }

    if (!shouldOmitSpan(entry.secureConnectionStart, entry.connectEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/TLS]' + route, {
        startTime: entry.secureConnectionStart
      }), entry.connectEnd)
    }

    if (!shouldOmitSpan(entry.requestStart, entry.responseStart)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/HTTPRequest]' + route, {
        startTime: entry.requestStart
      }), entry.responseStart)
    }

    if (!shouldOmitSpan(entry.responseStart, entry.responseEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/HTTPResponse]' + route, {
        startTime: entry.responseStart
      }), entry.responseEnd)
    }

    if (!shouldOmitSpan(entry.domContentLoadedEventStart, entry.domContentLoadedEventEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/DomContentLoadedEvent]' + route, {
        startTime: entry.domContentLoadedEventStart
      }), entry.domContentLoadedEventEnd)
    }

    if (!shouldOmitSpan(entry.loadEventStart, entry.loadEventEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/LoadEvent]' + route, {
        startTime: entry.loadEventStart
      }), entry.loadEventEnd)
    }
  }
}
