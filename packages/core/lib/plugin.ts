import { type Configuration, type InternalConfiguration } from './config'
import { type SpanFactory } from './span-factory'

export interface Plugin<C extends Configuration> {
  configure: (configuration: InternalConfiguration<C>, spanFactory: SpanFactory<C>) => void
}
