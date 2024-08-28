import { SpanAttributes } from './attributes'
import type { SpanAttribute, SpanAttributesSource } from './attributes'
import type { BackgroundingListener, BackgroundingListenerState } from './backgrounding-listener'
import type { Clock } from './clock'
import type { Configuration, Logger } from './config'
import type { IdGenerator } from './id-generator'
import type { NetworkSpanOptions } from './network-span'
import type { Processor } from './processor'
import type { ReadonlySampler } from './sampler'
import { SpanInternal, coreSpanOptionSchema } from './span'
import type { InternalSpanOptions, Span, SpanOptionSchema, SpanOptions } from './span'
import type { SpanContextStorage } from './span-context'
import { timeToNumber } from './time'
import { isObject, isParentContext } from './validation'

export const DISCARD_END_TIME = -1

export class SpanFactory <C extends Configuration> {
  private processor: Processor
  readonly sampler: ReadonlySampler
  private readonly idGenerator: IdGenerator
  private readonly spanAttributesSource: SpanAttributesSource<C>
  private readonly clock: Clock
  private readonly spanContextStorage: SpanContextStorage
  private logger: Logger

  private openSpans: WeakSet<SpanInternal> = new WeakSet<SpanInternal>()
  private isInForeground: boolean = true

  constructor (
    processor: Processor,
    sampler: ReadonlySampler,
    idGenerator: IdGenerator,
    spanAttributesSource: SpanAttributesSource<C>,
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

  startSpan (name: string, options: SpanOptions) {
    const safeStartTime = timeToNumber(this.clock, options.startTime)
    const spanId = this.idGenerator.generate(64)

    // if the parentContext option is not set use the current context
    // if parentContext is explicitly null, or there is no current context,
    // we are starting a new root span
    const parentContext = isParentContext(options.parentContext) || options.parentContext === null
      ? options.parentContext
      : this.spanContextStorage.current

    const parentSpanId = parentContext ? parentContext.id : undefined
    const traceId = parentContext ? parentContext.traceId : this.idGenerator.generate(128)

    const attributes = new SpanAttributes(new Map())

    if (typeof options.isFirstClass === 'boolean') {
      attributes.set('bugsnag.span.first_class', options.isFirstClass)
    }

    const span = new SpanInternal(spanId, traceId, name, safeStartTime, attributes, this.clock, parentSpanId)

    // don't track spans that are started while the app is backgrounded
    if (this.isInForeground) {
      this.openSpans.add(span)

      if (options.makeCurrentContext !== false) {
        this.spanContextStorage.push(span)
      }
    }

    return span
  }

  startNetworkSpan (options: NetworkSpanOptions) {
    const spanName = `[HTTP/${options.method.toUpperCase()}]`
    const cleanOptions = this.validateSpanOptions<NetworkSpanOptions>(spanName, options)
    const spanInternal = this.startSpan(cleanOptions.name, { ...cleanOptions.options, makeCurrentContext: false })

    spanInternal.setAttribute('bugsnag.span.category', 'network')
    spanInternal.setAttribute('http.method', options.method)
    spanInternal.setAttribute('http.url', options.url)

    return spanInternal
  }

  configure (processor: Processor, logger: Logger) {
    this.processor = processor
    this.logger = logger
  }

  endSpan (
    span: SpanInternal,
    endTime: number,
    additionalAttributes?: Record<string, SpanAttribute>
  ) {
    // remove the span from the context stack (this will also remove any invalid spans)
    this.spanContextStorage.pop(span)

    const untracked = !this.openSpans.delete(span)
    const isValidSpan = span.isValid()

    // log a warning if the span is already invalid and is not being tracked
    if (untracked && !isValidSpan) {
      this.logger.warn('Attempted to end a Span which is no longer valid.')
    }

    // spans should be discarded if:
    // - they are not tracked (i.e. discarded due to backgrounding)
    // - they are already invalid
    // - they have an explicit discard end time
    if (untracked || !isValidSpan || endTime === DISCARD_END_TIME) {
      // we still call end on the span so that it is no longer considered valid
      span.end(endTime, this.sampler.spanProbability)
      return
    }

    // Set any additional attributes
    for (const [key, value] of Object.entries(additionalAttributes || {})) {
      span.setAttribute(key, value)
    }

    this.spanAttributesSource.requestAttributes(span)

    const spanEnded = span.end(endTime, this.sampler.spanProbability)

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
      get samplingRate () {
        return span.samplingRate
      },
      isValid: () => span.isValid(),
      end: (endTime) => {
        const safeEndTime = timeToNumber(this.clock, endTime)
        this.endSpan(span, safeEndTime)
      }
    }
  }

  validateSpanOptions<O extends SpanOptions> (name: string, options: unknown, schema: SpanOptionSchema = coreSpanOptionSchema): InternalSpanOptions<O> {
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
      this.logger.warn(`Invalid span options${warnings}`)
    }

    return { name, options: cleanOptions } as unknown as InternalSpanOptions<O>
  }
}
