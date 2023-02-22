import { attributeToJson, type SpanAttribute } from './attributes'
import { type Clock } from './clock'

export type Time = Date | number

export interface Span {
  end: (endTime?: Time) => void
}

export enum Kind {
  unspecified = 0,
  internal = 1,
  server = 2,
  client = 3,
  producer = 4,
  consumer = 5
}

export interface SpanInternal {
  readonly id: string // 64 bit random string
  readonly name: string
  readonly kind: 'internal' | 'server' | 'client' | 'producer' | 'consumer'
  readonly traceId: string // 128 bit random string
  readonly attributes: SpanAttributes
  readonly startTime: number // stored in the format returned from Clock.now (see clock.ts)
  endTime?: number // stored in the format returned from Clock.now (see clock.ts) - written once when 'end' is called
}

export type SpanEnded = Required<SpanInternal>

export class SpanAttributes {
  private readonly attributes: Map<string, SpanAttribute>

  constructor (initialValues: Map<string, SpanAttribute>) {
    this.attributes = initialValues
  }

  public set (name: string, value: SpanAttribute) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      this.attributes.set(name, value)
    }
  }

  public remove (name: string) {
    this.attributes.delete(name)
  }

  public toJson () {
    return Array.from(this.attributes).map(([key, value]) => attributeToJson(key, value))
  }
}

export function spanToJson (span: SpanEnded, clock: Clock) {
  return {
    name: span.name,
    kind: Kind[span.kind],
    spanId: span.id,
    traceId: span.traceId,
    startTimeUnixNano: clock.toUnixTimestampNanoseconds(span.startTime),
    endTimeUnixNano: clock.toUnixTimestampNanoseconds(span.endTime),
    attributes: span.attributes.toJson()
  }
}
