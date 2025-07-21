import { TurboModuleRegistry, NativeEventEmitter } from 'react-native'
import type { Spec } from './NativeBugsnagNativeSpans'
import { RemoteParentContext } from '@bugsnag/core-performance'
import type { Clock, Plugin, PluginContext, Span, SpanAttribute } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000

interface SpanUpdateEvent {
  id: number
  name: string
  attributes: Array<{ name: string, value: SpanAttribute }>
  isEnded: boolean
  endTime?: number
}

interface SpanContextEvent {
  id: number
  name: string
}

const NativeNativeSpansModule = TurboModuleRegistry.get<Spec>('BugsnagNativeSpans')

export class BugsnagJavascriptSpansPlugin implements Plugin<ReactNativeConfiguration> {
  private spansByName = new Map<string, Span>()
  private timeout: ReturnType<typeof setTimeout> | null = null
  private clock?: Clock

  install (context: PluginContext<ReactNativeConfiguration>) {
    if (!NativeNativeSpansModule) {
      throw new Error('BugsnagNativeSpans module is not available. Ensure the native module is linked correctly.')
    }

    this.clock = context.clock
    context.addOnSpanStartCallback(this.onSpanStart.bind(this))
    context.addOnSpanEndCallback(this.onSpanEnd.bind(this))
    const eventEmitter = new NativeEventEmitter(NativeNativeSpansModule)
    eventEmitter.addListener('bugsnag:spanUpdate', this.onNativeSpanUpdate.bind(this))
    eventEmitter.addListener('bugsnag:retrieveSpanContext', this.onSpanContextEvent.bind(this))
  }

  start () {
    this.cleanup()
  }

  private onSpanStart (span: Span) {
    this.spansByName.set(span.name, span)
  }

  private onSpanEnd (span: Span) {
    const trackedSpan = this.spansByName.get(span.name)
    if (trackedSpan && trackedSpan.id === span.id && trackedSpan.traceId === span.traceId) {
      this.spansByName.delete(span.name)
    }

    return true
  }

  private onNativeSpanUpdate (event: SpanUpdateEvent) {
    let result = false

    try {
      const span = this.spansByName.get(event.name)
      if (!span) {
        return
      }

      if (event.attributes && event.attributes.length > 0) {
        for (const { name, value } of event.attributes) {
          span.setAttribute(name, value)
        }
      }

      if (event.isEnded) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        span.end(event.endTime ? this.clock!.fromUnixNanoseconds(event.endTime) : undefined)
      }

      result = true
    } finally {
      NativeNativeSpansModule?.reportSpanUpdateResult(event.id, result)
    }
  }

  private onSpanContextEvent (event: SpanContextEvent) {
    let result = null
    try {
      const span = this.spansByName.get(event.name)
      if (span) {
        result = RemoteParentContext.toTraceParentString(span)
      }
    } finally {
      NativeNativeSpansModule?.reportSpanContextResult(event.id, result)
    }
  }

  private cleanup () {
    for (const [name, span] of this.spansByName.entries()) {
      if (!span.isValid()) {
        this.spansByName.delete(name)
      }
    }

    if (this.timeout) clearTimeout(this.timeout)
    this.timeout = setTimeout(this.cleanup.bind(this), HOUR_IN_MILLISECONDS)
  }
}
