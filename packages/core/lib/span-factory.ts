import type { SpanAttribute, SpanAttributesLimits, SpanAttributesSource } from './attributes'
import { SpanAttributes } from './attributes'
import type { BackgroundingListener, BackgroundingListenerState } from './backgrounding-listener'
import type { Clock } from './clock'
import type { Configuration, InternalConfiguration, Logger, OnSpanEndCallbacks, OnSpanStartCallbacks } from './config'
import { defaultSpanAttributeLimits } from './custom-attribute-limits'
import type { IdGenerator } from './id-generator'
import type { NetworkSpanOptions } from './network-span'
import type { BufferingProcessor, Processor } from './processor'
import type { ReadonlySampler } from './sampler'
import type { InternalSpanOptions, Span, SpanOptionSchema, SpanOptions } from './span'
import { SpanInternal, coreSpanOptionSchema } from './span'
import type { SpanContextStorage } from './span-context'
import { timeToNumber } from './time'
import { isObject, isParentContext } from './validation'

export const DISCARD_END_TIME = -1

export type SpanFactoryConstructor<C extends Configuration> = new (
  ...args: ConstructorParameters<typeof SpanFactory<C>>
) => InstanceType<typeof SpanFactory<C>>

export class SpanFactory<C extends Configuration> {
  private processor: Processor
  readonly sampler: ReadonlySampler
  private readonly idGenerator: IdGenerator
  private readonly spanAttributesSource: SpanAttributesSource<C>
  protected readonly clock: Clock
  private readonly spanContextStorage: SpanContextStorage
  protected logger: Logger
  private spanAttributeLimits: SpanAttributesLimits = defaultSpanAttributeLimits
  protected onSpanStartCallbacks?: OnSpanStartCallbacks
  protected onSpanEndCallbacks?: OnSpanEndCallbacks

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
    // if the parentContext option is not set use the current context
    // if parentContext is explicitly null, or there is no current context,
    // we are starting a new root span
    options.parentContext = isParentContext(options.parentContext) || options.parentContext === null
      ? options.parentContext
      : this.spanContextStorage.current

    const attributes = new SpanAttributes(new Map(), this.spanAttributeLimits, name, this.logger)
    if (typeof options.isFirstClass === 'boolean') {
      attributes.set('bugsnag.span.first_class', options.isFirstClass)
    }

    const span = this.createSpanInternal(name, options, attributes)

    // don't track spans that are started while the app is backgrounded
    if (this.isInForeground) {
      this.openSpans.add(span)

      if (options.makeCurrentContext !== false) {
        this.spanContextStorage.push(span)
      }
    }

    this.onSpanStart(span)

    return span
  }

  private onSpanStart (spanInternal: SpanInternal) {
    if (this.onSpanStartCallbacks) {
      const span = this.toPublicApi(spanInternal)
      for (const onSpanStart of this.onSpanStartCallbacks) {
        try {
          onSpanStart(span)
        } catch (err) {
          this.logger.error('Error in onSpanStart callback: ' + err)
        }
      }
    }
  }

  protected createSpanInternal (
    name: string,
    options: SpanOptions,
    attributes: SpanAttributes) {
    const safeStartTime = timeToNumber(this.clock, options.startTime)
    const spanId = this.idGenerator.generate(64)
    const parentSpanId = options.parentContext ? options.parentContext.id : undefined
    const traceId = options.parentContext ? options.parentContext.traceId : this.idGenerator.generate(128)

    return new SpanInternal(spanId, traceId, name, safeStartTime, attributes, this.clock, this.sampler.probability, parentSpanId)
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

  configure (configuration: InternalConfiguration<C>) {
    this.logger = configuration.logger
    this.spanAttributesSource.configure(configuration)

    this.spanAttributeLimits = {
      attributeArrayLengthLimit: configuration.attributeArrayLengthLimit,
      attributeCountLimit: configuration.attributeCountLimit,
      attributeStringValueLimit: configuration.attributeStringValueLimit
    }

    this.onSpanStartCallbacks = configuration.onSpanStart
    this.onSpanEndCallbacks = configuration.onSpanEnd
  }

  reprocessEarlySpans (batchProcessor: Processor) {
    // ensure all spans in the buffering processor are added to the batch
    for (const span of (this.processor as BufferingProcessor).spans) {
      batchProcessor.add(span)
    }

    this.processor = batchProcessor
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
      this.discardSpan(span)
      return
    }

    // Set any additional attributes
    for (const [key, value] of Object.entries(additionalAttributes || {})) {
      span.setAttribute(key, value)
    }

    this.spanAttributesSource.requestAttributes(span)
    this.sendForProcessing(span, endTime)
  }

  protected discardSpan (span: SpanInternal) {
    // we still call end on the span so that it is no longer considered valid
    span.end(DISCARD_END_TIME, this.sampler.spanProbability)
  }

  protected sendForProcessing (span: SpanInternal, endTime: number) {
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
      get samplingProbability () {
        return span.samplingProbability
      },
      get name () {
        return span.name
      },
      isValid: () => span.isValid(),
      setAttribute: (name, value) => {
        span.setCustomAttribute(name, value)
      },
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
