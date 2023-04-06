import { type SpanAttributes } from './attributes'
import { type Clock } from './clock'
import { type DeliverySpan } from './delivery'

export type Time = Date | number

export interface Span {
  end: (endTime?: Time) => void
}

export const enum Kind {
  Unspecified = 0,
  Internal = 1,
  Server = 2,
  Client = 3,
  Producer = 4,
  Consumer = 5
}

export interface SpanInternal {
  readonly id: string // 64 bit random string
  readonly name: string
  readonly kind: Kind
  readonly traceId: string // 128 bit random string
  readonly attributes: SpanAttributes
  readonly startTime: number // stored in the format returned from Clock.now (see clock.ts)
  endTime?: number // stored in the format returned from Clock.now (see clock.ts) - written once when 'end' is called
  readonly samplingRate: number
}

export type SpanEnded = Required<SpanInternal>

export function spanToJson (span: SpanEnded, clock: Clock): DeliverySpan {
  return {
    name: span.name,
    kind: span.kind,
    spanId: span.id,
    traceId: span.traceId,
    startTimeUnixNano: clock.toUnixTimestampNanoseconds(span.startTime),
    endTimeUnixNano: clock.toUnixTimestampNanoseconds(span.endTime),
    attributes: span.attributes.toJson()
  }
}
