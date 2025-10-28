import { runSpanEndCallbacks, SpanFactory, SpanInternal, timeToNumber } from '@bugsnag/core-performance'
import type { SpanAttributes, SpanOptions } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from './config'
import NativeBugsnagPerformance from './native'

class NativeSpanInternal extends SpanInternal {
  public readonly isNativeSpan: boolean = true
}

interface ReactNativeSpanOptions extends SpanOptions {
  doNotDelegateToNativeSDK?: boolean
}

export const APP_START_BASE_NAME = '[AppStart/ReactNativeInit]'
const NAVIGATION_BASE_NAME = '[Navigation]'

export class ReactNativeSpanFactory<C extends ReactNativeConfiguration = ReactNativeConfiguration> extends SpanFactory<C> {
  private attachedToNative = false
  appStartSpan?: SpanInternal
  private appStartSpanCreated = false

  onAttach () {
    this.attachedToNative = true
  }

  startSpan (name: string, options: ReactNativeSpanOptions) {
    return super.startSpan(name, options)
  }

  protected createSpanInternal (name: string, options: ReactNativeSpanOptions, attributes: SpanAttributes) {
    if (!this.attachedToNative || options.isFirstClass !== true || options.doNotDelegateToNativeSDK === true) {
      return super.createSpanInternal(name, options, attributes)
    }

    const safeStartTime = timeToNumber(this.clock, options.startTime)
    const unixStartTimeNanos = this.clock.toUnixNanoseconds(safeStartTime)
    const nativeParentContext = options.parentContext ? { id: options.parentContext.id, traceId: options.parentContext.traceId } : undefined
    const nativeSpan = NativeBugsnagPerformance.startNativeSpan(name, { startTime: unixStartTimeNanos, parentContext: nativeParentContext })
    return new NativeSpanInternal(nativeSpan.id, nativeSpan.traceId, name, safeStartTime, attributes, this.clock, this.sampler.probability, nativeSpan.parentSpanId)
  }

  protected discardSpan (span: NativeSpanInternal) {
    if (span.isNativeSpan) {
      NativeBugsnagPerformance.discardNativeSpan(span.id, span.traceId)
    }

    super.discardSpan(span)
  }

  protected sendForProcessing (span: NativeSpanInternal, endTime: number) {
    span.isNativeSpan ? this.processNativeSpan(span, endTime) : super.sendForProcessing(span, endTime)
  }

  private async processNativeSpan (span: NativeSpanInternal, endTime: number) {
    const spanEnded = span.end(endTime, this.sampler.spanProbability)
    const shouldSend = await runSpanEndCallbacks(spanEnded, this.logger, this.onSpanEndCallbacks)

    if (shouldSend) {
      const unixEndTimeNanos = this.clock.toUnixNanoseconds(endTime)
      const attributes = spanEnded.attributes.toObject()
      delete attributes['bugsnag.sampling.p']
      NativeBugsnagPerformance.endNativeSpan(spanEnded.id, spanEnded.traceId, unixEndTimeNanos, attributes)
    } else {
      NativeBugsnagPerformance.discardNativeSpan(spanEnded.id, spanEnded.traceId)
    }
  }

  startNavigationSpan (routeName: string, spanOptions: ReactNativeSpanOptions) {
    // Navigation spans are always first class, but are not delegated to the native SDK
    spanOptions.isFirstClass = true
    spanOptions.doNotDelegateToNativeSDK = true

    const spanName = NAVIGATION_BASE_NAME + routeName
    const span = this.startSpan(spanName, spanOptions)

    // Default navigation span attributes
    span.setAttribute('bugsnag.span.category', 'navigation')
    span.setAttribute('bugsnag.navigation.route', routeName)

    return span
  }

  startAppStartSpan (appStartTime: number) {
    // Ensure we only ever create one app start span
    if (!this.appStartSpan && !this.appStartSpanCreated) {
      this.appStartSpan = this.startSpan(APP_START_BASE_NAME, { startTime: appStartTime, parentContext: null })
      this.appStartSpan.setAttribute('bugsnag.span.category', 'app_start')
      this.appStartSpan.setAttribute('bugsnag.app_start.type', 'ReactNativeInit')
      this.appStartSpanCreated = true
    }
  }

  endAppStartSpan (endTime: number) {
    if (this.appStartSpan?.isValid()) {
      this.endSpan(this.appStartSpan, endTime)
      this.appStartSpan = undefined
    }
  }
}
