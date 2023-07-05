import { type SpanAttribute, type SpanAttributes } from './attributes'
import { type Clock } from './clock'
import { type Logger } from './config'
import { type DeliverySpan } from './delivery'
import { SpanEvents } from './events'
import { type SpanContext } from './span-context'
import { type Time } from './time'
import traceIdToSamplingRate from './trace-id-to-sampling-rate'
import { isBoolean, isObject, isSpanContext, isTime } from './validation'

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
  private readonly parentSpanId?: string
  private readonly startTime: number
  private readonly samplingRate: number
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
      samplingProbability,
      parentSpanId: this.parentSpanId
    }
  }

  isValid () {
    return this.endTime === undefined
  }
}

export interface SpanOptions {
  startTime?: Time
  makeCurrentContext?: boolean
  parentContext?: SpanContext | null
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

export function validateSpanOptions<O extends SpanOptions> (name: string, options: unknown, schema: SpanOptionSchema, logger: Logger): InternalSpanOptions<O> {
  let warnings = ''
  const cleanOptions: Record<string, unknown> = {}

  if (typeof name !== 'string') {
    warnings += `\n  - name should be a string, got ${typeof name}`
    name = String(name)
  }

  if (options !== undefined && !isObject(options)) {
    warnings += '\n  - options is not an object'
  } else {
    const spanOptions = options || {}
    for (const option of Object.keys(schema)) {
      if (Object.prototype.hasOwnProperty.call(spanOptions, option) && spanOptions[option] !== undefined) {
        if (schema[option].validate(spanOptions[option])) {
          cleanOptions[option] = spanOptions[option]
        } else {
          warnings += `\n  - ${option} ${schema[option].message}, got ${typeof spanOptions[option]}`
          cleanOptions[option] = schema[option].getDefaultValue(spanOptions[option])
        }
      } else {
        cleanOptions[option] = schema[option].getDefaultValue(spanOptions[option])
      }
    }
  }

  if (warnings.length > 0) {
    logger.warn(`Invalid span options${warnings}`)
  }

  return { name, options: cleanOptions } as unknown as InternalSpanOptions<O>
}
