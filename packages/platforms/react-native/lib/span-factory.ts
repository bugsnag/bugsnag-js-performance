import { SpanFactory } from '@bugsnag/core-performance'
import type { SpanAttributes, ParentContext } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from './config'
import type { NativeSettings } from './NativeBugsnagPerformance'

export class ReactNativeSpanFactory extends SpanFactory<ReactNativeConfiguration> {
  private attachedToNative = false

  attach (nativeConfig: NativeSettings) {
    this.attachedToNative = nativeConfig.isNativePerformanceAvailable
  }

  protected createSpanInternal (name: string, startTime: number, parentContext: ParentContext | null | undefined, isFirstClass: boolean | undefined, attributes: SpanAttributes) {
    return super.createSpanInternal(name, startTime, parentContext, isFirstClass, attributes)
  }
}
