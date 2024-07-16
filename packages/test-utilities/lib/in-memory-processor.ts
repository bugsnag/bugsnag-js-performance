import type { SpanEnded, Processor } from '@bugsnag/core-performance'

class InMemoryProcessor implements Processor {
  public readonly spans: SpanEnded[] = []

  add (span: SpanEnded): void {
    this.spans.push(span)
  }

  configure (): void {}
}

export default InMemoryProcessor
