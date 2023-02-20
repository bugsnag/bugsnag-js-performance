import type { ResourceAttributes } from './attributes'
import type { Configuration } from './core'
import type { SpanInternal } from './span'

// processor.add is called by a Span when 'Span.end' is called
// it can then add to a queue or send immediately
export interface Processor {
  add: (span: SpanInternal) => void
  configure: (config: Required<Configuration>, resourceAttributesSource: () => ResourceAttributes) => void
}
