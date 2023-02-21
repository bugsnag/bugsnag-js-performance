import { attributeToJson, type SpanAttribute } from './attributes'

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

export class SpanAttributes {
  public readonly attributes: Map<string, SpanAttribute>

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
}

export function spanToJson (span: SpanInternal) {
  return {
    name: span.name,
    kind: Kind[span.kind],
    spanId: span.id,
    traceId: span.traceId,
    startTimeUnixNano: span.startTime, // TODO: Convert to absolute timestamp
    endTimeUnixNano: span.endTime, // TODO: Convert to absolute timestamp
    attributes: Object.entries(span.attributes.attributes).map(([key, value]) => attributeToJson(key, value))
  }
}
