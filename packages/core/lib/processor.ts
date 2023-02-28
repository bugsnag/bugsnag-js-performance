import type { SpanInternal } from './span.js'

// processor.add is called by a Span when 'Span.end' is called
// it can then add to a queue or send immediately
export interface Processor {
  add: (span: SpanInternal) => void
}
