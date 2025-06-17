import { SpanQuery } from '@bugsnag/core-performance'
import type { Configuration, Plugin, PluginContext, Span, SpanControlProvider, Time } from '@bugsnag/core-performance'

class NamedSpanControl {
  constructor (private readonly span: Span) {
  }

  setAttribute (key: string, value: any) {
    this.span.setAttribute(key, value)
  }

  end (endTime?: Time) {
    this.span.end(endTime)
  }

  isValid (): boolean {
    return this.span.isValid()
  }
}

export class NamedSpanQuery extends SpanQuery<NamedSpanControl> {
  constructor (public readonly name: string) {
    super()
  }
}

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000

export class BugsnagNamedSpansPlugin implements Plugin<Configuration>, SpanControlProvider<NamedSpanControl> {
  private spanControls = new Map<string, NamedSpanControl>()
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
    this.spanControls.set(span.name, new NamedSpanControl(span))
  }

  onSpanEnd (span: Span) {
    this.spanControls.delete(span.name)
    return true
  }

  getSpanControls<Q> (query: Q): NamedSpanControl | null {
    if (query instanceof NamedSpanQuery) {
      return this.spanControls.get(query.name) || null
    }

    return null
  }

  private cleanup () {
    for (const [name, spanControl] of this.spanControls.entries()) {
      if (!spanControl.isValid()) {
        this.spanControls.delete(name)
      }
    }

    if (this.timeout) clearTimeout(this.timeout)
    this.timeout = setTimeout(this.cleanup.bind(this), HOUR_IN_MILLISECONDS) // Cleanup every hour
  }
}
