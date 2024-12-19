import { SpanFactory, SpanInternal } from '@bugsnag/core-performance'
import type { SpanAttributes, ParentContext } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from './config'
import type { NativeSettings } from './NativeBugsnagPerformance'
import NativeBugsnagPerformance from './native'
import type { ReactNativeClock } from './clock'

class NativeSpanInternal extends SpanInternal {
  public readonly isNativeSpan: boolean = true
}

export class ReactNativeSpanFactory extends SpanFactory<ReactNativeConfiguration> {
  private attachedToNative = false

  attach (nativeConfig: NativeSettings) {
    this.attachedToNative = nativeConfig.isNativePerformanceAvailable
  }

  protected createSpanInternal (name: string, startTime: number, parentContext: ParentContext | null | undefined, isFirstClass: boolean | undefined, attributes: SpanAttributes) {
    if (!NativeBugsnagPerformance || !this.attachedToNative || isFirstClass !== true) {
      return super.createSpanInternal(name, startTime, parentContext, isFirstClass, attributes)
    }

    const unixStartTimeNanos = (this.clock as ReactNativeClock).toUnixNanoseconds(startTime)
    const nativeSpan = NativeBugsnagPerformance.startNativeSpan(name, { startTime: unixStartTimeNanos, parentContext })
    return new NativeSpanInternal(nativeSpan.id, nativeSpan.traceId, name, startTime, attributes, this.clock, nativeSpan.parentSpanId)
  }

  protected discardSpan (span: NativeSpanInternal, endTime: number) {
    if (span.isNativeSpan) {
      NativeBugsnagPerformance?.discardNativeSpan(span.id, span.traceId)
    }

    super.discardSpan(span, endTime)
  }

  protected sendForProcessing (span: NativeSpanInternal, endTime: number) {
    if (!span.isNativeSpan) {
      return super.sendForProcessing(span, endTime)
    }

    // TODO: run callbacks
    const spanEnded = span.end(endTime, this.sampler.spanProbability)
    NativeBugsnagPerformance?.endNativeSpan(span.id, span.traceId, endTime, spanEnded.attributes.toObject())
  }
}
