import type { DeliverySpan, TracePayload } from '@bugsnag/core-performance'

type PayloadCreator = (...spans: Array<Partial<DeliverySpan>>) => TracePayload

export default function makePayloadCreator (): PayloadCreator {
  let id = 0

  return function createPayload (...spans: Array<Partial<DeliverySpan>>): TracePayload {
    return {
      body: {
        resourceSpans: [
          {
            resource: {
              attributes: []
            },
            scopeSpans: [
              {
                spans: spans.map((span: Partial<DeliverySpan>) => ({
                  name: span.name || `span #${++id}`,
                  kind: span.kind === undefined ? 1 : span.kind,
                  spanId: span.spanId || 'span ' + String(id).repeat(27),
                  traceId: 'trace ' + String(id).repeat(26),
                  startTimeUnixNano: span.startTimeUnixNano || '123',
                  endTimeUnixNano: span.endTimeUnixNano || '456',
                  attributes: span.attributes || [],
                  ...(span.droppedAttributesCount && span.droppedAttributesCount > 0 ? { droppedAttributesCount: span.droppedAttributesCount } : {}),
                  events: span.events || []
                }))
              }
            ]
          }
        ]
      },
      headers: {
        'Bugsnag-Api-Key': 'abcdefabcdefabcdefabcdefabcdef12',
        'Content-Type': 'application/json' as const,
        'Bugsnag-Span-Sampling': `1:${spans.length}`
      }
    }
  }
}
