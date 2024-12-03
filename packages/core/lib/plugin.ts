import type { Configuration, InternalConfiguration } from './config'
import type { AppState } from './core'
import type { SpanFactory } from './span-factory'

export interface Plugin<C extends Configuration> {
  configure: (configuration: InternalConfiguration<C>, spanFactory: SpanFactory<C>, setAppState: (state: AppState) => void) => void
}
