import { MockSpanFactory } from '@bugsnag/js-performance-test-utilities'
import { instrumentPageLoadPhaseSpans } from '../../lib/auto-instrumentation/page-load-phase-spans'
import { PerformanceFake, createPerformanceNavigationTimingFake } from '../utilities'
import { type SpanContext } from '@bugsnag/core-performance'

const PAGE_LOAD_ID = 'page load span ID'
const PAGE_LOAD_TRACE_ID = 'page load span trace ID'
const fullPageLoadSpan: SpanContext = { id: PAGE_LOAD_ID, traceId: PAGE_LOAD_TRACE_ID, isValid: () => true }

describe('PageLoadPhase Spans', () => {
  it('automatically creates expected spans', () => {
    const spanFactory = new MockSpanFactory()
    const performance = new PerformanceFake()
    performance.addEntries(createPerformanceNavigationTimingFake({
      startTime: 1,
      unloadEventStart: 2,
      unloadEventEnd: 3,
      redirectStart: 4,
      redirectEnd: 5,
      workerStart: 6,
      fetchStart: 7,
      domainLookupStart: 8,
      domainLookupEnd: 9,
      connectStart: 10,
      secureConnectionStart: 11,
      connectEnd: 12,
      requestStart: 13,
      responseStart: 14,
      responseEnd: 15,
      domInteractive: 16,
      domContentLoadedEventStart: 17,
      domContentLoadedEventEnd: 18,
      domComplete: 19,
      loadEventStart: 20,
      loadEventEnd: 21
    }))

    instrumentPageLoadPhaseSpans(spanFactory, performance, '/page-load-phase-spans', fullPageLoadSpan)

    expect(spanFactory.createdSpans).toStrictEqual([
      expect.objectContaining({
        name: '[PageLoadPhase/Unload]/page-load-phase-spans',
        startTime: 2,
        endTime: 3,
        parentSpanId: PAGE_LOAD_ID,
        traceId: PAGE_LOAD_TRACE_ID
      }),
      expect.objectContaining({
        name: '[PageLoadPhase/Redirect]/page-load-phase-spans',
        startTime: 4,
        endTime: 5,
        parentSpanId: PAGE_LOAD_ID,
        traceId: PAGE_LOAD_TRACE_ID
      }),
      expect.objectContaining({
        name: '[PageLoadPhase/LoadFromCache]/page-load-phase-spans',
        startTime: 7,
        endTime: 8,
        parentSpanId: PAGE_LOAD_ID,
        traceId: PAGE_LOAD_TRACE_ID
      }),
      expect.objectContaining({
        name: '[PageLoadPhase/DNSLookup]/page-load-phase-spans',
        startTime: 8,
        endTime: 9,
        parentSpanId: PAGE_LOAD_ID,
        traceId: PAGE_LOAD_TRACE_ID
      }),
      expect.objectContaining({
        name: '[PageLoadPhase/TCPHandshake]/page-load-phase-spans',
        startTime: 10,
        endTime: 11,
        parentSpanId: PAGE_LOAD_ID,
        traceId: PAGE_LOAD_TRACE_ID
      }),
      expect.objectContaining({
        name: '[PageLoadPhase/TLS]/page-load-phase-spans',
        startTime: 11,
        endTime: 12,
        parentSpanId: PAGE_LOAD_ID,
        traceId: PAGE_LOAD_TRACE_ID
      }),
      expect.objectContaining({
        name: '[PageLoadPhase/HTTPRequest]/page-load-phase-spans',
        startTime: 13,
        endTime: 14,
        parentSpanId: PAGE_LOAD_ID,
        traceId: PAGE_LOAD_TRACE_ID
      }),
      expect.objectContaining({
        name: '[PageLoadPhase/HTTPResponse]/page-load-phase-spans',
        startTime: 14,
        endTime: 15,
        parentSpanId: PAGE_LOAD_ID,
        traceId: PAGE_LOAD_TRACE_ID
      }),
      expect.objectContaining({
        name: '[PageLoadPhase/DomContentLoadedEvent]/page-load-phase-spans',
        startTime: 17,
        endTime: 18,
        parentSpanId: PAGE_LOAD_ID,
        traceId: PAGE_LOAD_TRACE_ID
      }),
      expect.objectContaining({
        name: '[PageLoadPhase/LoadEvent]/page-load-phase-spans',
        startTime: 20,
        endTime: 21,
        parentSpanId: PAGE_LOAD_ID,
        traceId: PAGE_LOAD_TRACE_ID
      })
    ])
  })

  it('does not create a span if both timestamps are 0', () => {
    const spanFactory = new MockSpanFactory()
    const performance = new PerformanceFake()
    performance.addEntries(createPerformanceNavigationTimingFake({
      unloadEventStart: 0,
      unloadEventEnd: 1,
      redirectStart: 0,
      redirectEnd: 0
    }))

    instrumentPageLoadPhaseSpans(spanFactory, performance, '/page-load-phase-spans', fullPageLoadSpan)

    expect(spanFactory.createdSpans).toContainEqual(expect.objectContaining({
      name: '[PageLoadPhase/Unload]/page-load-phase-spans',
      startTime: 0,
      endTime: 1,
      parentSpanId: PAGE_LOAD_ID,
      traceId: PAGE_LOAD_TRACE_ID
    }))

    expect(spanFactory.createdSpans).not.toContainEqual(expect.objectContaining({
      name: '[PageLoadPhase/Redirect]/page-load-phase-spans'
    }))
  })

  it('does not create a span if either timestamp is undefined', () => {
    const spanFactory = new MockSpanFactory()
    const performance = new PerformanceFake()
    performance.addEntries(createPerformanceNavigationTimingFake({
      unloadEventStart: 1,
      unloadEventEnd: undefined,
      redirectStart: undefined,
      redirectEnd: 2
    }))

    instrumentPageLoadPhaseSpans(spanFactory, performance, '/page-load-phase-spans', fullPageLoadSpan)

    expect(spanFactory.createdSpans).not.toContainEqual(expect.objectContaining({
      name: '[PageLoadPhase/Unload]/page-load-phase-spans'
    }))

    expect(spanFactory.createdSpans).not.toContainEqual(expect.objectContaining({
      name: '[PageLoadPhase/Redirect]/page-load-phase-spans'
    }))
  })
})
