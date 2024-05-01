import { SpanAttributes, type SpanAttributesSource } from './attributes'
import { type BackgroundingListener, type BackgroundingListenerState } from './backgrounding-listener'
import { type Clock } from './clock'
import { type Configuration, type Logger } from './config'
import { type IdGenerator } from './id-generator'
import { type NetworkSpanOptions } from './network-span'
import { type Processor } from './processor'
import { type ReadonlySampler } from './sampler'
import { SpanInternal, coreSpanOptionSchema, type InternalSpanOptions, type Span, type SpanOptionSchema, type SpanOptions } from './span'
import { type SpanContextStorage } from './span-context'
import { timeToNumber } from './time'
import { isObject, isSpanContext } from './validation'

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
    const parentContext = isSpanContext(options.parentContext) || options.parentContext === null
      ? options.parentContext
      : this.spanContextStorage.current

    const parentSpanId = parentContext ? parentContext.id : undefined
    const traceId = parentContext ? parentContext.traceId : this.idGenerator.generate(128)

    const attributes = new SpanAttributes(new Map())

    if (typeof options.isFirstClass === 'boolean') {
      attributes.set('bugsnag.span.first_class', options.isFirstClass)
    }

    const span = new SpanInternal(spanId, traceId, name, safeStartTime, attributes, parentSpanId)

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
    // Use method as the span name, prefixed with [HTTP]
    const cleanOptions = this.validateSpanOptions<NetworkSpanOptions>(options.method, options)
    const spanInternal = this.startSpan(`[HTTP]${cleanOptions.name.toUpperCase()}`, { ...cleanOptions.options, makeCurrentContext: false })

    spanInternal.setAttribute('bugsnag.span.category', 'network')
    spanInternal.setAttribute('http.method', options.method)
    spanInternal.setAttribute('http.url', options.url)

    // TODO: Set http.status_code attribute on span.end
    return spanInternal
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

    // Discard marked spans
    if (endTime === DISCARD_END_TIME) return

    this.spanAttributesSource.requestAttributes(span)

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
