import { type SpanEnded } from '../../lib/span'
import { type Processor } from '../../lib/processor'

class InMemoryProcessor implements Processor {
  public readonly spans: SpanEnded[] = []

  add (span: SpanEnded): void {
    this.spans.push(span)
  }

  configure (): void {}
}

export default InMemoryProcessor
