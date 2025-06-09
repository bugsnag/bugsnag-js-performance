import type { Clock } from './clock'
import type { Configuration, Logger, OnSpanEndCallback, OnSpanStartCallback } from './config'
import { Priority } from './prioritized-set'
import type { Prioritized } from './prioritized-set'
import type { SpanControlProvider } from './span-control-provider'

export interface Plugin<C extends Configuration> {
  install: (context: PluginContext<C>) => void
  start: () => void
}

export class PluginContext<C extends Configuration> {
  public readonly onSpanStartCallbacks: Array<Prioritized<OnSpanStartCallback>> = []
  public readonly onSpanEndCallbacks: Array<Prioritized<OnSpanEndCallback>> = []
  public readonly spanControlProviders: Array<Prioritized<SpanControlProvider<unknown>>> = []

  constructor (
    public readonly configuration: C,
    public readonly clock: Clock
  ) {}

  addOnSpanStartCallback (callback: OnSpanStartCallback, priority = Priority.NORMAL): void {
    this.onSpanStartCallbacks.push({ item: callback, priority })
  }

  addOnSpanEndCallback (callback: OnSpanEndCallback, priority = Priority.NORMAL): void {
    this.onSpanEndCallbacks.push({ item: callback, priority })
  }

  addSpanControlProvider (provider: SpanControlProvider<unknown>, priority = Priority.NORMAL): void {
    this.spanControlProviders.push({ item: provider, priority })
  }

  mergeFrom (context: PluginContext<C>): void {
    this.onSpanStartCallbacks.push(...context.onSpanStartCallbacks)
    this.onSpanEndCallbacks.push(...context.onSpanEndCallbacks)
    this.spanControlProviders.push(...context.spanControlProviders)
  }
}

interface Constructor<T> { new(): T, prototype: T }

export class PluginManager<C extends Configuration> {
  private readonly plugins: Array<Plugin<C>> = []
  private readonly installedPlugins = new Set<Plugin<C>>()
  private logger?: Logger

  addPlugins (plugins: Array<Plugin<C>>) {
    this.plugins.push(...plugins)
  }

  installPlugins (configuration: C, clock: Clock): PluginContext<C> {
    this.logger = configuration.logger
    const mergedContext = new PluginContext(configuration, clock)

    for (const plugin of this.plugins) {
      if (this.installedPlugins.has(plugin)) {
        continue
      }

      try {
        const context = new PluginContext(configuration, clock)
        plugin.install(context)

        mergedContext.mergeFrom(context)
        this.installedPlugins.add(plugin)
      } catch (err) {
        if (this.logger) this.logger.error(`Plugin ${plugin.constructor.name} failed to install: ${err}`)
      }
    }

    return mergedContext
  }

  startPlugins (): void {
    for (const plugin of this.installedPlugins) {
      try {
        plugin.start()
      } catch (err) {
        if (this.logger) this.logger.error(`Plugin ${plugin.constructor.name} failed to start: ${err}`)
      }
    }
  }

  getPlugin <T extends Plugin<C>> (Constructor: Constructor<T>) {
    for (const plugin of this.installedPlugins) {
      if (plugin instanceof Constructor) {
        return plugin
      }
    }
  }
}
