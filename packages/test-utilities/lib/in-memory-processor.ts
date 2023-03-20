import { type SpanEnded, type Processor } from '@bugsnag/js-performance-core'

class InMemoryProcessor implements Processor {
  public readonly spans: SpanEnded[] = []

  add (span: SpanEnded): void {
    this.spans.push(span)
  }

  configure (): void {}
}

export default InMemoryProcessor
