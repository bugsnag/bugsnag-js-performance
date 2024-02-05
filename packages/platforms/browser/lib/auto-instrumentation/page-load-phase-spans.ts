import type { SpanContext, SpanFactory } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from '../config'
import { type PerformanceWithTiming } from '../on-settle/load-event-end-settler'

type PageLoadPhase = 'Unload'
| 'Redirect'
| 'LoadFromCache'
| 'DNSLookup'
| 'TCPHandshake'
| 'TLS'
| 'HTTPRequest'
| 'HTTPResponse'
| 'DomContentLoadedEvent'
| 'LoadEvent'

function shouldOmitSpan (startTime?: number, endTime?: number): boolean {
  return (startTime === undefined || endTime === undefined) ||
  (startTime === 0 && endTime === 0)
}

export const instrumentPageLoadPhaseSpans = (
  spanFactory: SpanFactory<BrowserConfiguration>,
  performance: PerformanceWithTiming,
  route: string,
  parentContext: SpanContext
) => {
  function createPageLoadPhaseSpan (phase: PageLoadPhase, startTime: number, endTime: number) {
    if (shouldOmitSpan(startTime, endTime)) return
    const span = spanFactory.startSpan(`[PageLoadPhase/${phase}]${route}`, {
      startTime,
      parentContext,
      makeCurrentContext: false
    })

    span.setAttribute('bugsnag.span.category', 'page_load_phase')
    span.setAttribute('bugsnag.phase', phase)
    spanFactory.endSpan(span, endTime)
  }

  const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  const entry = Array.isArray(entries) && entries[0]

  if (entry) {
    createPageLoadPhaseSpan('Unload', entry.unloadEventStart, entry.unloadEventEnd)
    createPageLoadPhaseSpan('Redirect', entry.redirectStart, entry.redirectEnd)
    createPageLoadPhaseSpan('LoadFromCache', entry.fetchStart, entry.domainLookupStart)
    createPageLoadPhaseSpan('DNSLookup', entry.domainLookupStart, entry.domainLookupEnd)

    // secureConectionStart will be 0 if no secure connection is used so use connectEnd in that case
    const TCPHandshakeEnd = entry.secureConnectionStart || entry.connectEnd
    createPageLoadPhaseSpan('TCPHandshake', entry.connectStart, TCPHandshakeEnd)

    createPageLoadPhaseSpan('TLS', entry.secureConnectionStart, entry.connectEnd)
    createPageLoadPhaseSpan('HTTPRequest', entry.requestStart, entry.responseStart)
    createPageLoadPhaseSpan('HTTPResponse', entry.responseStart, entry.responseEnd)
    createPageLoadPhaseSpan('DomContentLoadedEvent', entry.domContentLoadedEventStart, entry.domContentLoadedEventEnd)
    createPageLoadPhaseSpan('LoadEvent', entry.loadEventStart, entry.loadEventEnd)
  }
}
