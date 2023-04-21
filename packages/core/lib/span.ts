import { SpanAttributes, type SpanAttribute, type SpanAttributesSource } from './attributes'
import { type Clock } from './clock'
import { type DeliverySpan } from './delivery'
import { SpanEvents } from './events'
import { type IdGenerator } from './id-generator'
import type Sampler from './sampler'
import sanitizeTime, { type Time } from './time'
import traceIdToSamplingRate from './trace-id-to-sampling-rate'

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

// use a unique symbol to define a 'SpanProbability' type that can't be confused
// with the 'number' type
// this prevents the wrong kind of number being assigned to the span's
// samplingProbability
// this exists only in the type system; at runtime it's a regular number
declare const validSpanProbability: unique symbol
export type SpanProbability = number & { [validSpanProbability]: true }

export interface SpanEnded {
  readonly id: string // 64 bit random string
  readonly name: string
  readonly kind: Kind
  readonly traceId: string // 128 bit random string
  readonly attributes: SpanAttributes
  readonly events: SpanEvents
  readonly startTime: number // stored in the format returned from Clock.now (see clock.ts)
  readonly samplingRate: number
  readonly endTime: number // stored in the format returned from Clock.now (see clock.ts) - written once when 'end' is called
  samplingProbability: SpanProbability
}

export function spanToJson (span: SpanEnded, clock: Clock): DeliverySpan {
  return {
    name: span.name,
    kind: span.kind,
    spanId: span.id,
    traceId: span.traceId,
    startTimeUnixNano: clock.toUnixTimestampNanoseconds(span.startTime),
    endTimeUnixNano: clock.toUnixTimestampNanoseconds(span.endTime),
    attributes: span.attributes.toJson(),
    events: span.events.toJson(clock)
  }
}
export class SpanInternal {
  private id: string
  private traceId: string
  private startTime: number
  private samplingRate: number
  private kind = Kind.Client // TODO: How do we define the initial Kind?
  private events = new SpanEvents()

  constructor (private name: string, startTime: number, private attributes: SpanAttributes, private clock: Clock, idGenerator: IdGenerator, private sampler: Sampler) {
    this.id = idGenerator.generate(64)
    this.traceId = idGenerator.generate(128)
    this.startTime = sanitizeTime(clock, startTime)
    this.samplingRate = traceIdToSamplingRate(this.traceId)
  }

  end (endTime?: Time): SpanEnded {
    const safeEndTime = sanitizeTime(this.clock, endTime)

    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      traceId: this.traceId,
      startTime: this.startTime,
      endTime: safeEndTime,
      attributes: this.attributes,
      events: this.events,
      samplingRate: this.samplingRate,
      samplingProbability: this.sampler.spanProbability
    }
  }

  addEvent (name: string, time: Time) {
    this.events.add(name, sanitizeTime(this.clock, time))
  }

  setAttribute (name: string, value: SpanAttribute) {
    this.attributes.set(name, value)
  }
}

export class SpanFactory {
  constructor (private clock: Clock, private spanAttributesSource: SpanAttributesSource, private idGenerator: IdGenerator, private sampler: Sampler) {}

  startSpan (name: string, startTime?: Time) {
    const attributes = new SpanAttributes(this.spanAttributesSource())
    const safeStartTime = sanitizeTime(this.clock, startTime)

    return new SpanInternal(name, safeStartTime, attributes, this.clock, this.idGenerator, this.sampler)
  }
}
