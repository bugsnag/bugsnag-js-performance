import { SpanQuery } from '@bugsnag/core-performance'
import type { Configuration, Plugin, PluginContext, Span, SpanControlProvider } from '@bugsnag/core-performance'

export class NamedSpanQuery extends SpanQuery<Span> {
  constructor (public readonly name: string) {
    super()
  }
}

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000

export class BugsnagNamedSpansPlugin implements Plugin<Configuration>, SpanControlProvider<Span> {
  private spansByName = new Map<string, Span>()
  private timeout: ReturnType<typeof setTimeout> | null = null

  install (context: PluginContext<Configuration>) {
    context.addOnSpanStartCallback(this.onSpanStart.bind(this))
    context.addOnSpanEndCallback(this.onSpanEnd.bind(this))
    context.addSpanControlProvider(this)
  }

  start () {
    this.cleanup()
  }

  onSpanStart (span: Span) {
    this.spansByName.set(span.name, span)
  }

  onSpanEnd (span: Span) {
    const trackedSpan = this.spansByName.get(span.name)
    if (trackedSpan && trackedSpan.id === span.id && trackedSpan.traceId === span.traceId) {
      this.spansByName.delete(span.name)
    }

    return true
  }

  getSpanControls<Q> (query: Q): Span | null {
    if (query instanceof NamedSpanQuery) {
      return this.spansByName.get(query.name) || null
    }

    return null
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
