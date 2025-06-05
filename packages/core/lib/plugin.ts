import type { Clock } from './clock'
import type { Configuration, InternalConfiguration, OnSpanEndCallback, OnSpanStartCallback } from './config'
import PrioritizedSet from './prioritized-set'
import type { SpanControlProvider } from './span-control-provider'

// const HIGH_PRIORITY = 0
const NORMAL_PRIORITY = 10_000
// const LOW_PRIORITY = 100_000

export interface Plugin<C extends Configuration> {
  install: (context: PluginContext<C>) => void
  start: () => void
}

export class PluginContext<C extends Configuration> {
  constructor (
    public readonly configuration: InternalConfiguration<C>, public readonly clock: Clock) {}

  private readonly onSpanStartCallbacks = new PrioritizedSet<OnSpanStartCallback>()
  private readonly onSpanEndCallbacks = new PrioritizedSet<OnSpanEndCallback>()
  private readonly spanControlProviders = new PrioritizedSet<SpanControlProvider<unknown>>()

  addOnSpanStartCallback (callback: OnSpanStartCallback, priority = NORMAL_PRIORITY): void {
    this.onSpanStartCallbacks.add(callback, priority)
  }

  addOnSpanEndCallback (callback: OnSpanEndCallback, priority = NORMAL_PRIORITY): void {
    this.onSpanEndCallbacks.add(callback, priority)
  }

  addSpanControlProvider (provider: SpanControlProvider<unknown>, priority = NORMAL_PRIORITY): void {
    this.spanControlProviders.add(provider, priority)
  }
}
