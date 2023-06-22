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
  parentContext: SpanContext
) => {
  function createPageLoadPhaseSpan (name: string, startTime: number, endTime: number) {
    if (shouldOmitSpan(startTime, endTime)) return
    spanFactory.endSpan(spanFactory.startSpan(name + route, {
      startTime,
      parentContext,
      makeCurrentContext: false
    }), endTime)
  }

  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  if (entry) {
    createPageLoadPhaseSpan('[PageLoadPhase/Unload]', entry.unloadEventStart, entry.unloadEventEnd)
    createPageLoadPhaseSpan('[PageLoadPhase/Redirect]', entry.redirectStart, entry.redirectEnd)
    createPageLoadPhaseSpan('[PageLoadPhase/LoadFromCache]', entry.fetchStart, entry.domainLookupStart)
    createPageLoadPhaseSpan('[PageLoadPhase/DNSLookup]', entry.domainLookupStart, entry.domainLookupEnd)

    // secureConectionStart will be 0 if no secure connection is used so use connectEnd in that case
    const TCPHandshakeEnd = entry.secureConnectionStart || entry.connectEnd
    createPageLoadPhaseSpan('[PageLoadPhase/TCPHandshake]', entry.connectStart, TCPHandshakeEnd)

    createPageLoadPhaseSpan('[PageLoadPhase/TLS]', entry.secureConnectionStart, entry.connectEnd)
    createPageLoadPhaseSpan('[PageLoadPhase/HTTPRequest]', entry.requestStart, entry.responseStart)
    createPageLoadPhaseSpan('[PageLoadPhase/HTTPResponse]', entry.responseStart, entry.responseEnd)
    createPageLoadPhaseSpan('[PageLoadPhase/DomContentLoadedEvent]', entry.domContentLoadedEventStart, entry.domContentLoadedEventEnd)
    createPageLoadPhaseSpan('[PageLoadPhase/LoadEvent]', entry.loadEventStart, entry.loadEventEnd)
  }
}
