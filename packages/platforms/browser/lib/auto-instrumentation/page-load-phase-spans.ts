import type { SpanContext, SpanFactory } from '@bugsnag/core-performance'
import { type PerformanceWithTiming } from '../on-settle/load-event-end-settler'

function shouldOmitSpan (startTime?: number, endTime?: number): boolean {
  return (startTime === undefined || endTime === undefined) ||
  (startTime === 0 && endTime === 0)
}

export const instrumentPageLoadPhaseSpans = (
  spanFactory: SpanFactory,
  performance: PerformanceWithTiming,
  route: string,
  pageLoadSpan: SpanContext
) => {
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  if (entry) {
    if (!shouldOmitSpan(entry.unloadEventStart, entry.unloadEventEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/Unload]' + route, {
        startTime: entry.unloadEventStart,
        parentContext: pageLoadSpan,
        makeCurrentContext: false
      }), entry.unloadEventEnd)
    }

    if (!shouldOmitSpan(entry.redirectStart, entry.redirectEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/Redirect]' + route, {
        startTime: entry.redirectStart,
        parentContext: pageLoadSpan,
        makeCurrentContext: false
      }), entry.redirectEnd)
    }

    if (!shouldOmitSpan(entry.fetchStart, entry.domainLookupStart)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/LoadFromCache]' + route, {
        startTime: entry.fetchStart,
        parentContext: pageLoadSpan,
        makeCurrentContext: false
      }), entry.domainLookupStart)
    }

    if (!shouldOmitSpan(entry.domainLookupStart, entry.domainLookupEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/DNSLookup]' + route, {
        startTime: entry.domainLookupStart,
        parentContext: pageLoadSpan,
        makeCurrentContext: false
      }), entry.domainLookupEnd)
    }

    // secureConectionStart will be 0 if no secure connection is used
    // so use connectEnd in that case
    const TCPHandshakeEnd = entry.secureConnectionStart || entry.connectEnd
    if (!shouldOmitSpan(entry.connectStart, TCPHandshakeEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/TCPHandshake]' + route, {
        startTime: entry.connectStart,
        parentContext: pageLoadSpan,
        makeCurrentContext: false
      }), TCPHandshakeEnd)
    }

    if (!shouldOmitSpan(entry.secureConnectionStart, entry.connectEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/TLS]' + route, {
        startTime: entry.secureConnectionStart,
        parentContext: pageLoadSpan,
        makeCurrentContext: false
      }), entry.connectEnd)
    }

    if (!shouldOmitSpan(entry.requestStart, entry.responseStart)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/HTTPRequest]' + route, {
        startTime: entry.requestStart,
        parentContext: pageLoadSpan,
        makeCurrentContext: false
      }), entry.responseStart)
    }

    if (!shouldOmitSpan(entry.responseStart, entry.responseEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/HTTPResponse]' + route, {
        startTime: entry.responseStart,
        parentContext: pageLoadSpan,
        makeCurrentContext: false
      }), entry.responseEnd)
    }

    if (!shouldOmitSpan(entry.domContentLoadedEventStart, entry.domContentLoadedEventEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/DomContentLoadedEvent]' + route, {
        startTime: entry.domContentLoadedEventStart,
        parentContext: pageLoadSpan,
        makeCurrentContext: false
      }), entry.domContentLoadedEventEnd)
    }

    if (!shouldOmitSpan(entry.loadEventStart, entry.loadEventEnd)) {
      spanFactory.endSpan(spanFactory.startSpan('[PageLoadPhase/LoadEvent]' + route, {
        startTime: entry.loadEventStart,
        parentContext: pageLoadSpan,
        makeCurrentContext: false
      }), entry.loadEventEnd)
    }
  }
}
