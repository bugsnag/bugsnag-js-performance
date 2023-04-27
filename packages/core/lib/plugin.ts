import { type InternalConfiguration } from './config'
import { type SpanFactory } from './span'

export interface Plugin {
  load: (spanFactory: SpanFactory) => void
  configure: (configuration: InternalConfiguration) => void
}
