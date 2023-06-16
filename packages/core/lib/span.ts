import { SpanAttributes, type SpanAttribute, type SpanAttributesSource } from './attributes'
import { type BackgroundingListenerState, type BackgroundingListener } from './backgrounding-listener'
import { type Clock } from './clock'
import { type Logger } from './config'
import { type DeliverySpan } from './delivery'
import { SpanEvents } from './events'
import { type IdGenerator } from './id-generator'
import { type Processor } from './processor'
import { type ReadonlySampler } from './sampler'
import { type SpanContext, type SpanContextStorage } from './span-context'
import { type Time, timeToNumber } from './time'
import traceIdToSamplingRate from './trace-id-to-sampling-rate'

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
  private readonly name: string
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
}

export class SpanFactory {
  private processor: Processor
  private readonly sampler: ReadonlySampler
  private readonly idGenerator: IdGenerator
  private readonly spanAttributesSource: SpanAttributesSource
  private readonly clock: Clock
  private readonly spanContextStorage: SpanContextStorage
  private logger: Logger

  private openSpans: WeakSet<SpanInternal> = new WeakSet<SpanInternal>()
  private isInForeground: boolean = true

  constructor (
    processor: Processor,
    sampler: ReadonlySampler,
    idGenerator: IdGenerator,
    spanAttributesSource: SpanAttributesSource,
    clock: Clock,
    backgroundingListener: BackgroundingListener,
    logger: Logger,
    spanContextStorage: SpanContextStorage
  ) {
    this.processor = processor
    this.sampler = sampler
    this.idGenerator = idGenerator
    this.spanAttributesSource = spanAttributesSource
    this.clock = clock
    this.logger = logger
    this.spanContextStorage = spanContextStorage

    // this will fire immediately if the app is already backgrounded
    backgroundingListener.onStateChange(this.onBackgroundStateChange)
  }

  private onBackgroundStateChange = (state: BackgroundingListenerState) => {
    this.isInForeground = state === 'in-foreground'
    // clear all open spans regardless of the new background state
    // since spans are only valid if they start and end while the app is in the foreground
    this.openSpans = new WeakSet<SpanInternal>()
  }

  startSpan (name: string, options: SpanOptions = {}) {
    const safeStartTime = timeToNumber(this.clock, options ? options.startTime : undefined)
    const spanId = this.idGenerator.generate(64)
    const traceId = this.idGenerator.generate(128)
    const attributes = new SpanAttributes(this.spanAttributesSource())
    const span = new SpanInternal(spanId, traceId, name, safeStartTime, attributes)

    // don't track spans that are started while the app is backgrounded
    if (this.isInForeground) {
      this.openSpans.add(span)

      if (!options || options.makeCurrentContext !== false) {
        this.spanContextStorage.push(span)
      }
    }

    return span
  }

  configure (processor: Processor, logger: Logger) {
    this.processor = processor
    this.logger = logger
  }

  endSpan (
    span: SpanInternal,
    endTime: number
  ) {
    // if the span doesn't exist here it shouldn't be processed
    if (!this.openSpans.delete(span)) {
      this.logger.warn('Attempted to end a Span which has already ended or been discarded.')
      return
    }

    const spanEnded = span.end(endTime, this.sampler.spanProbability)
    this.spanContextStorage.pop(span)

    if (this.sampler.sample(spanEnded)) {
      this.processor.add(spanEnded)
    }
  }

  toPublicApi (span: SpanInternal): Span {
    return {
      get id () {
        return span.id
      },
      get traceId () {
        return span.traceId
      },
      isValid: () => span.isValid(),
      end: (endTime) => {
        const safeEndTime = timeToNumber(this.clock, endTime)
        this.endSpan(span, safeEndTime)
      }
    }
  }
}
