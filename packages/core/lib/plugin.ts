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
}

interface Constructor<T> { new(): T, prototype: T }

export class PluginManager<C extends Configuration> {
  private readonly plugins: Array<Plugin<C>> = []
  private readonly installedPlugins: Array<Plugin<C>> = []
  private logger?: Logger

  addPlugins (plugins: Array<Plugin<C>>) {
    this.plugins.push(...plugins)
  }

  installPlugins (context: PluginContext<C>): void {
    this.logger = context.configuration.logger

    for (const plugin of this.plugins) {
      if (this.installedPlugins.includes(plugin)) {
        continue
      }

      try {
        plugin.install(context)
        this.installedPlugins.push(plugin)
      } catch (err) {
        if (this.logger) this.logger.error(`Plugin ${plugin.constructor.name} failed to install: ${err}`)
      }
    }
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
