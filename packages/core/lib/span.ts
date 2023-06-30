import { type SpanAttribute, type SpanAttributes } from './attributes'
import { type Clock } from './clock'
import { type Logger } from './config'
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

interface CleanSpanOptions extends SpanOptions {
  name: string
}

export function validateSpanOptions (name: string, options: SpanOptions, logger: Logger): CleanSpanOptions {
  let warnings = ''
  const cleanOptions = {
    name,
    startTime: options.startTime,
    parentContext: options.parentContext,
    makeCurrentContext: options.makeCurrentContext,
    isFirstClass: options.isFirstClass
  }

  if (typeof cleanOptions.name !== 'string') {
    warnings += `\n - name should be a string, got ${typeof name}`
    cleanOptions.name = String(name)
  }

  if (cleanOptions.startTime !== undefined && !isTime(cleanOptions.startTime)) {
    warnings += `\n - startTime should be a number or Date, got ${typeof cleanOptions.startTime}`
    cleanOptions.startTime = undefined
  }

  if (cleanOptions.parentContext && !isSpanContext(cleanOptions.parentContext)) {
    warnings += `\n - parentContext should be a SpanContext, got ${typeof cleanOptions.parentContext}`
    cleanOptions.parentContext = undefined
  }

  if (cleanOptions.makeCurrentContext !== undefined && !isBoolean(cleanOptions.makeCurrentContext)) {
    warnings += `\n - makeCurrentContext should be true|false, got ${typeof cleanOptions.makeCurrentContext}`
    cleanOptions.makeCurrentContext = undefined
  }

  if (cleanOptions.isFirstClass !== undefined && !isBoolean(cleanOptions.isFirstClass)) {
    warnings += `\n - isFirstClass should be true|false, got ${typeof cleanOptions.isFirstClass}`
    cleanOptions.isFirstClass = undefined
  }

  if (warnings.length > 0) {
    logger.warn(`Invalid span options ${warnings}`)
  }

  return cleanOptions
}
