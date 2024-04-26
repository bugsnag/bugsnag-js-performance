import { type SpanAttribute, type SpanAttributes } from './attributes'
import { type Clock } from './clock'
import { type DeliverySpan } from './delivery'
import { SpanEvents } from './events'
import { type SpanContext } from './span-context'
import { type Time } from './time'
import traceIdToSamplingRate from './trace-id-to-sampling-rate'
import { isBoolean, isSpanContext, isTime } from './validation'

export interface Span extends SpanContext {
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
declare const validScaledProbability: unique symbol
export type ScaledProbability = number & { [validScaledProbability]: true }

export interface SpanProbability {
  readonly scaled: ScaledProbability
  readonly raw: number
}

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
  readonly parentSpanId?: string
}

export function spanToJson (span: SpanEnded, clock: Clock): DeliverySpan {
  return {
    name: span.name,
    kind: span.kind,
    spanId: span.id,
    traceId: span.traceId,
    parentSpanId: span.parentSpanId,
    startTimeUnixNano: clock.toUnixTimestampNanoseconds(span.startTime),
    endTimeUnixNano: clock.toUnixTimestampNanoseconds(span.endTime),
    attributes: span.attributes.toJson(),
    events: span.events.toJson(clock)
  }
}

export class SpanInternal implements SpanContext {
  readonly id: string
  readonly traceId: string
  readonly parentSpanId?: string
  readonly samplingRate: number
  private readonly startTime: number
  private readonly kind = Kind.Client // TODO: How do we define the initial Kind?
  private readonly events = new SpanEvents()
  private readonly attributes: SpanAttributes
  name: string
  private endTime?: number

  constructor (id: string, traceId: string, name: string, startTime: number, attributes: SpanAttributes, parentSpanId?: string) {
    this.id = id
    this.traceId = traceId
    this.parentSpanId = parentSpanId
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

  end (endTime: number, samplingProbability: SpanProbability): SpanEnded {
    this.endTime = endTime
    let _samplingProbability = samplingProbability

    this.attributes.set('bugsnag.sampling.p', _samplingProbability.raw)

    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      traceId: this.traceId,
      startTime: this.startTime,
      attributes: this.attributes,
      events: this.events,
      samplingRate: this.samplingRate,
      endTime,
      get samplingProbability (): SpanProbability {
        return _samplingProbability
      },
      set samplingProbability (samplingProbability: SpanProbability) {
        _samplingProbability = samplingProbability
        this.attributes.set('bugsnag.sampling.p', _samplingProbability.raw)
      },
      parentSpanId: this.parentSpanId
    }
  }

  isValid () {
    return this.endTime === undefined
  }
}

export interface ParentContext {
  readonly id: string // 64 bit random string
  readonly traceId: string // 128 bit random string
}

export interface SpanOptions {
  startTime?: Time
  makeCurrentContext?: boolean
  parentContext?: ParentContext | null
  isFirstClass?: boolean
}

export interface SpanOption<T> {
  message: string
  getDefaultValue: (value: unknown) => T | undefined
  validate: (value: unknown) => value is T
}

export interface InternalSpanOptions<O extends SpanOptions> {
  name: string
  options: O
}

export type SpanOptionSchema = Record<string, SpanOption<unknown>>

export const coreSpanOptionSchema: SpanOptionSchema = {
  startTime: {
    message: 'should be a number or Date',
    getDefaultValue: () => undefined,
    validate: isTime
  },
  parentContext: {
    message: 'should be a SpanContext',
    getDefaultValue: () => undefined,
    validate: (value): value is SpanContext => value === null || isSpanContext(value)
  },
  makeCurrentContext: {
    message: 'should be true|false',
    getDefaultValue: () => undefined,
    validate: isBoolean
  },
  isFirstClass: {
    message: 'should be true|false',
    getDefaultValue: () => undefined,
    validate: isBoolean
  }
}
