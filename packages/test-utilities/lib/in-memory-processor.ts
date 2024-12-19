import type { SpanEnded, Processor, Span } from '@bugsnag/core-performance'

class InMemoryProcessor implements Processor {
  public readonly spans: SpanEnded[] = []

  add (span: SpanEnded): void {
    this.spans.push(span)
  }

  configure (): void {}

  async runCallbacks (span: Span) {
    return true
  }
}

export default InMemoryProcessor
