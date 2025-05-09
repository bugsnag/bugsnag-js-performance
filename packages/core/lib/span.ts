import type { SpanAttribute, SpanAttributes } from './attributes'
import { millisecondsToNanoseconds } from './clock'
import type { Clock } from './clock'
import type { Logger, OnSpanEndCallbacks } from './config'
import type { DeliverySpan } from './delivery'
import { SpanEvents } from './events'
import type { SpanContext } from './span-context'
import type { Time } from './time'
import traceIdToSamplingRate from './trace-id-to-sampling-rate'
import { isBoolean, isSpanContext, isTime } from './validation'

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000

export interface Span extends SpanContext {
  readonly name: string
  end: (endTime?: Time) => void
  setAttribute: (name: string, value: SpanAttribute) => void
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
    ...(span.attributes.droppedAttributesCount > 0 ? { droppedAttributesCount: span.attributes.droppedAttributesCount } : {}),
    startTimeUnixNano: clock.toUnixTimestampNanoseconds(span.startTime),
    endTimeUnixNano: clock.toUnixTimestampNanoseconds(span.endTime),
    attributes: span.attributes.toJson(),
    events: span.events.toJson(clock)
  }
}

export function spanEndedToSpan (span: SpanEnded): Span {
  return {
    get id () {
      return span.id
    },
    get traceId () {
      return span.traceId
    },
    get samplingRate () {
      return span.samplingRate
    },
    get samplingProbability () {
      return span.samplingProbability.raw
    },
    get name () {
      return span.name
    },
    isValid: () => false,
    end: () => {}, // no-op
    setAttribute: (name, value) => { span.attributes.setCustom(name, value) }
  }
}

export async function runSpanEndCallbacks (spanEnded: SpanEnded, logger: Logger, callbacks?: OnSpanEndCallbacks) {
  if (!callbacks) return true

  const span = spanEndedToSpan(spanEnded)
  const callbackStartTime = performance.now()
  let shouldSample = true
  for (const callback of callbacks) {
    try {
      let result = callback(span)

      // @ts-expect-error result may or may not be a promise
      if (typeof result.then === 'function') {
        result = await result
      }

      if (result === false) {
        shouldSample = false
        break
      }
    } catch (err) {
      logger.error('Error in onSpanEnd callback: ' + err)
    }
  }
  if (shouldSample) {
    const duration = millisecondsToNanoseconds(performance.now() - callbackStartTime)
    span.setAttribute('bugsnag.span.callbacks_duration', duration)
  }
  return shouldSample
}

export class SpanInternal implements SpanContext {
  readonly id: string
  readonly traceId: string
  readonly parentSpanId?: string
  readonly samplingRate: number
  readonly samplingProbability: number
  private readonly startTime: number
  private readonly kind = Kind.Client // TODO: How do we define the initial Kind?
  private readonly events = new SpanEvents()
  private readonly attributes: SpanAttributes
  private readonly clock: Clock
  name: string
  private endTime?: number

  constructor (id: string, traceId: string, name: string, startTime: number, attributes: SpanAttributes, clock: Clock, samplingProbability: number, parentSpanId?: string) {
    this.id = id
    this.traceId = traceId
    this.parentSpanId = parentSpanId
    this.name = name
    this.startTime = startTime
    this.attributes = attributes
    this.samplingRate = traceIdToSamplingRate(this.traceId)
    this.samplingProbability = samplingProbability
    this.clock = clock
  }

  addEvent (name: string, time: number) {
    this.events.add(name, time)
  }

  setAttribute (name: string, value: SpanAttribute) {
    this.attributes.set(name, value)
  }

  setCustomAttribute (name: string, value: SpanAttribute) {
    this.attributes.setCustom(name, value)
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
    return this.endTime === undefined && this.startTime > (this.clock.now() - HOUR_IN_MILLISECONDS)
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
