import { runSpanEndCallbacks, SpanFactory, SpanInternal } from '@bugsnag/core-performance'
import type { SpanAttributes, ParentContext } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from './config'
import NativeBugsnagPerformance from './native'
import type { ReactNativeClock } from './clock'

class NativeSpanInternal extends SpanInternal {
  public readonly isNativeSpan: boolean = true
}

export class ReactNativeSpanFactory extends SpanFactory<ReactNativeConfiguration> {
  private attachedToNative = false

  onAttach () {
    this.attachedToNative = true
  }

  protected createSpanInternal (name: string, startTime: number, parentContext: ParentContext | null | undefined, isFirstClass: boolean | undefined, attributes: SpanAttributes) {
    if (!NativeBugsnagPerformance || !this.attachedToNative || isFirstClass !== true) {
      return super.createSpanInternal(name, startTime, parentContext, isFirstClass, attributes)
    }

    const unixStartTimeNanos = (this.clock as ReactNativeClock).toUnixNanoseconds(startTime)
    const nativeParentContext = parentContext ? { id: parentContext.id, traceId: parentContext.traceId } : undefined
    const nativeSpan = NativeBugsnagPerformance.startNativeSpan(name, { startTime: unixStartTimeNanos, parentContext: nativeParentContext })
    return new NativeSpanInternal(nativeSpan.id, nativeSpan.traceId, name, startTime, attributes, this.clock, nativeSpan.parentSpanId)
  }

  protected discardSpan (span: NativeSpanInternal, endTime: number) {
    if (span.isNativeSpan) {
      NativeBugsnagPerformance?.discardNativeSpan(span.id, span.traceId)
    }

    super.discardSpan(span, endTime)
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
      NativeBugsnagPerformance?.endNativeSpan(spanEnded.id, spanEnded.traceId, unixEndTimeNanos, attributes)
    } else {
      NativeBugsnagPerformance?.discardNativeSpan(spanEnded.id, spanEnded.traceId)
    }
  }
}
