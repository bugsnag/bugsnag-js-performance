import { SpanAttributes, type SpanAttributesSource } from './attributes'
import { type BackgroundingListener, type BackgroundingListenerState } from './backgrounding-listener'
import { type Clock } from './clock'
import { type Logger } from './config'
import { type IdGenerator } from './id-generator'
import { type Processor } from './processor'
import { type ReadonlySampler } from './sampler'
import { type Span, SpanInternal, type SpanOptions, validateSpanOptions } from './span'
import { type SpanContextStorage } from './span-context'
import { timeToNumber } from './time'
import { isSpanContext } from './validation'

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

  startSpan (name: string, options?: SpanOptions) {
    const cleanOptions = validateSpanOptions(name, options || {}, this.logger)

    const safeStartTime = timeToNumber(this.clock, cleanOptions.startTime)
    const spanId = this.idGenerator.generate(64)

    // if the parentContext option is not set use the current context
    // if parentContext is explicitly null, or there is no current context,
    // we are starting a new root span
    const parentContext = isSpanContext(cleanOptions.parentContext) || cleanOptions.parentContext === null
      ? cleanOptions.parentContext
      : this.spanContextStorage.current

    const parentSpanId = parentContext ? parentContext.id : undefined
    const traceId = parentContext ? parentContext.traceId : this.idGenerator.generate(128)

    const attributes = new SpanAttributes(this.spanAttributesSource())

    if (typeof cleanOptions.isFirstClass === 'boolean') {
      attributes.set('bugsnag.span.first_class', cleanOptions.isFirstClass)
    }

    const span = new SpanInternal(spanId, traceId, cleanOptions.name, safeStartTime, attributes, parentSpanId)

    // don't track spans that are started while the app is backgrounded
    if (this.isInForeground) {
      this.openSpans.add(span)

      if (!cleanOptions || cleanOptions.makeCurrentContext !== false) {
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
      // only warn if the span has already been ended explicitly rather than
      // discarded by us
      if (!span.isValid()) {
        this.logger.warn('Attempted to end a Span which has already ended.')
      }

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
