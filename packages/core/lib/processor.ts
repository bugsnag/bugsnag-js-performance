import { type InternalConfiguration } from './config'
import { type SpanEnded } from './span'

// processor.add is called by a Span when 'Span.end' is called
// it can then add to a queue or send immediately
export interface Processor {
  add: (span: SpanEnded) => void
}

export interface ProcessorFactory {
  create: (
    configuration: InternalConfiguration,
  ) => Processor
}

// a processor that buffers spans in memory until the client has started
// not sure if this would need to be platform specific — will we ever care about
// persisting spans if 'start' is never called?
export class BufferingProcessor implements Processor {
  public readonly spans: SpanEnded[]

  constructor () {
    this.spans = []
  }

  add (span: SpanEnded): void {
    this.spans.push(span)
  }
}
