import { runSpanEndCallbacks, SpanFactory, SpanInternal, timeToNumber } from '@bugsnag/core-performance'
import type { SpanAttributes, SpanOptions } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from './config'
import NativeBugsnagPerformance from './native'
import type { ReactNativeClock } from './clock'

class NativeSpanInternal extends SpanInternal {
  public readonly isNativeSpan: boolean = true
}

interface ReactNativeSpanOptions extends SpanOptions {
  doNotDelegateToNativeSDK?: boolean
}

export class ReactNativeSpanFactory extends SpanFactory<ReactNativeConfiguration> {
  private attachedToNative = false

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
    const unixStartTimeNanos = (this.clock as ReactNativeClock).toUnixNanoseconds(safeStartTime)
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
      const unixEndTimeNanos = (this.clock as ReactNativeClock).toUnixNanoseconds(endTime)
      const attributes = spanEnded.attributes.toObject()
      delete attributes['bugsnag.sampling.p']
      NativeBugsnagPerformance.endNativeSpan(spanEnded.id, spanEnded.traceId, unixEndTimeNanos, attributes)
    } else {
      NativeBugsnagPerformance.discardNativeSpan(spanEnded.id, spanEnded.traceId)
    }
  }

  startNavigationSpan (routeName: string, spanOptions: ReactNativeSpanOptions) {
    // Navigation spans are always first class
    spanOptions.isFirstClass = true

    const spanName = '[Navigation]' + routeName
    const span = this.startSpan(spanName, spanOptions)

    // Default navigation span attributes
    span.setAttribute('bugsnag.span.category', 'navigation')
    span.setAttribute('bugsnag.navigation.route', routeName)

    return span
  }
}
