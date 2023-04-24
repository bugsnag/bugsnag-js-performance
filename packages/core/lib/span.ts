import { SpanAttributes, type SpanAttribute, type SpanAttributesSource } from './attributes'
import { type Clock } from './clock'
import { type DeliverySpan } from './delivery'
import { SpanEvents } from './events'
import { type IdGenerator } from './id-generator'
import { type Processor } from './processor'
import type Sampler from './sampler'
import { type Time } from './time'
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
  private readonly id: string
  private readonly traceId: string
  private readonly startTime: number
  private readonly samplingRate: number
  private readonly kind = Kind.Client // TODO: How do we define the initial Kind?
  private readonly events = new SpanEvents()
  private readonly attributes: SpanAttributes
  private readonly name: string

  constructor (id: string, traceId: string, name: string, startTime: number, attributes: SpanAttributes) {
    this.id = id
    this.traceId = traceId
    this.name = name
    this.startTime = startTime
    this.attributes = attributes
    this.samplingRate = traceIdToSamplingRate(this.traceId)
  }

  addEvent (name: string, time: number) {
    this.events.add(name, time)
  }

  setAttribute (name: string, value: SpanAttribute) {
    this.attributes.set(name, value)
  }

  getProperties () {
    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      traceId: this.traceId,
      startTime: this.startTime,
      attributes: this.attributes,
      events: this.events,
      samplingRate: this.samplingRate
    }
  }
}

export class SpanFactory {
  private readonly idGenerator: IdGenerator
  private readonly spanAttributesSource: SpanAttributesSource

  constructor (idGenerator: IdGenerator, spanAttributesSource: SpanAttributesSource) {
    this.idGenerator = idGenerator
    this.spanAttributesSource = spanAttributesSource
  }

  startSpan (name: string, startTime: number) {
    const spanId = this.idGenerator.generate(64)
    const traceId = this.idGenerator.generate(128)
    const attributes = new SpanAttributes(this.spanAttributesSource())

    return new SpanInternal(spanId, traceId, name, startTime, attributes)
  }

  endSpan (
    span: SpanInternal,
    endTime: number,
    sampler: Sampler,
    processor: Processor
  ) {
    const spanEnded: SpanEnded = {
      ...span.getProperties(),
      endTime,
      samplingProbability: sampler.spanProbability
    }

    if (sampler.sample(spanEnded)) {
      processor.add(spanEnded)
    }
  }
}
