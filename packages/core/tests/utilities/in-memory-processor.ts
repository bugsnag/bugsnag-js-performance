import type { SpanInternal } from '../../lib/span'
import type { Processor } from '../../lib/processor'

class InMemoryProcessor implements Processor {
  public readonly spans: SpanInternal[] = []

  add (span: SpanInternal): void {
    this.spans.push(span)
  }
}

export default InMemoryProcessor
