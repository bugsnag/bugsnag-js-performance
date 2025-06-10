import { PluginContext, PluginManager } from '../lib/plugin'
import type { Plugin } from '../lib/plugin'
import type { Clock } from '../lib/clock'
import type { Configuration } from '../lib/config'
import { Priority } from '../lib/prioritized-set'
import type { SpanControlProvider } from '../lib/span-control-provider'
import { createConfiguration, IncrementingClock } from '@bugsnag/js-performance-test-utilities'

describe('PluginContext', () => {
  let clock: Clock
  let config: Configuration
  let context: PluginContext<Configuration>

  beforeEach(() => {
    clock = new IncrementingClock()
    config = createConfiguration()
    context = new PluginContext(config, clock)
  })

  describe('addOnSpanStartCallback', () => {
    it('adds span start callbacks with correct priority', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      context.addOnSpanStartCallback(callback1, Priority.HIGH)
      context.addOnSpanStartCallback(callback2, Priority.LOW)

      expect(context.onSpanStartCallbacks).toEqual([
        { item: callback1, priority: Priority.HIGH },
        { item: callback2, priority: Priority.LOW }
      ])
    })
  })

  describe('addOnSpanEndCallback', () => {
    it('adds span end callbacks with correct priority', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      context.addOnSpanEndCallback(callback1)
      context.addOnSpanEndCallback(callback2, Priority.HIGH)

      expect(context.onSpanEndCallbacks).toEqual([
        { item: callback1, priority: Priority.NORMAL },
        { item: callback2, priority: Priority.HIGH }
      ])
    })
  })

  describe('addSpanControlProvider', () => {
    it('adds span control providers with correct priority', () => {
      const provider1: SpanControlProvider<unknown> = { getSpanControls: jest.fn() }
      const provider2: SpanControlProvider<unknown> = { getSpanControls: jest.fn() }

      context.addSpanControlProvider(provider1)
      context.addSpanControlProvider(provider2, Priority.LOW)

      expect(context.spanControlProviders).toEqual([
        { item: provider1, priority: Priority.NORMAL },
        { item: provider2, priority: Priority.LOW }
      ])
    })
  })

  describe('mergeFrom', () => {
    it('merges callbacks and providers from another context', () => {
      // Setup existing callbacks in context
      const existingStartCallback = jest.fn()
      const existingEndCallback = jest.fn()
      const existingProvider: SpanControlProvider<unknown> = { getSpanControls: jest.fn() }

      context.addOnSpanStartCallback(existingStartCallback, Priority.HIGH)
      context.addOnSpanEndCallback(existingEndCallback, Priority.NORMAL)
      context.addSpanControlProvider(existingProvider, Priority.LOW)

      // Setup callbacks to merge from other context
      const otherContext = new PluginContext(config, clock)
      const newStartCallback = jest.fn()
      const newEndCallback = jest.fn()
      const newProvider: SpanControlProvider<unknown> = { getSpanControls: jest.fn() }

      otherContext.addOnSpanStartCallback(newStartCallback, Priority.NORMAL)
      otherContext.addOnSpanEndCallback(newEndCallback, Priority.HIGH)
      otherContext.addSpanControlProvider(newProvider, Priority.HIGH)

      // Perform merge
      context.mergeFrom(otherContext)

      // Verify all callbacks are present and order is maintained
      expect(context.onSpanStartCallbacks).toEqual([
        { item: existingStartCallback, priority: Priority.HIGH },
        { item: newStartCallback, priority: Priority.NORMAL }
      ])
      expect(context.onSpanEndCallbacks).toEqual([
        { item: existingEndCallback, priority: Priority.NORMAL },
        { item: newEndCallback, priority: Priority.HIGH }
      ])
      expect(context.spanControlProviders).toEqual([
        { item: existingProvider, priority: Priority.LOW },
        { item: newProvider, priority: Priority.HIGH }
      ])
    })
  })
})

describe('PluginManager', () => {
  let manager: PluginManager<Configuration>
  let mockPlugin1: Plugin<Configuration>
  let mockPlugin2: Plugin<Configuration>

  beforeEach(() => {
    manager = new PluginManager()
    mockPlugin1 = { install: jest.fn(), start: jest.fn() }
    mockPlugin2 = { install: jest.fn(), start: jest.fn() }
  })

  describe('installPlugins', () => {
    it('installs plugins correctly', () => {
      manager.addPlugins([mockPlugin1, mockPlugin2])
      manager.installPlugins(createConfiguration(), new IncrementingClock())

      expect(mockPlugin1.install).toHaveBeenCalledWith(expect.any(PluginContext))
      expect(mockPlugin2.install).toHaveBeenCalledWith(expect.any(PluginContext))
    })

    it('returns a merged plugin context', () => {
      const plugin1SpanStartCallback = jest.fn()
      const plugin1SpanEndCallback = jest.fn()
      const plugin1SpanControlProvider = { getSpanControls: jest.fn() }
      const plugin2SpanStartCallback = jest.fn()
      const plugin2SpanEndCallback = jest.fn()
      const plugin2SpanControlProvider = { getSpanControls: jest.fn() }

      mockPlugin1.install = jest.fn(context => {
        context.addOnSpanStartCallback(plugin1SpanStartCallback, Priority.HIGH)
        context.addOnSpanEndCallback(plugin1SpanEndCallback, Priority.NORMAL)
        context.addSpanControlProvider(plugin1SpanControlProvider, Priority.LOW)
      })

      mockPlugin2.install = jest.fn(context => {
        context.addOnSpanStartCallback(plugin2SpanStartCallback, Priority.NORMAL)
        context.addOnSpanEndCallback(plugin2SpanEndCallback, Priority.HIGH)
        context.addSpanControlProvider(plugin2SpanControlProvider, Priority.HIGH)
      })

      manager.addPlugins([mockPlugin1, mockPlugin2])
      const mergedContext = manager.installPlugins(createConfiguration(), new IncrementingClock())

      expect(mergedContext).toBeInstanceOf(PluginContext)

      expect(mergedContext.onSpanStartCallbacks).toEqual([
        { item: plugin1SpanStartCallback, priority: Priority.HIGH },
        { item: plugin2SpanStartCallback, priority: Priority.NORMAL }
      ])
      expect(mergedContext.onSpanEndCallbacks).toEqual([
        { item: plugin1SpanEndCallback, priority: Priority.NORMAL },
        { item: plugin2SpanEndCallback, priority: Priority.HIGH }
      ])
      expect(mergedContext.spanControlProviders).toEqual([
        { item: plugin1SpanControlProvider, priority: Priority.LOW },
        { item: plugin2SpanControlProvider, priority: Priority.HIGH }
      ])
    })

    it('does not reinstall already installed plugins', () => {
      manager.addPlugins([mockPlugin1])
      manager.installPlugins(createConfiguration(), new IncrementingClock())
      manager.installPlugins(createConfiguration(), new IncrementingClock())

      expect(mockPlugin1.install).toHaveBeenCalledTimes(1)
    })

    it('handles errors during plugin installation', () => {
      const populateContext = (context: PluginContext<Configuration>, priority: number) => {
        context.addOnSpanStartCallback(() => {}, priority)
        context.addOnSpanEndCallback(() => true, priority)
        context.addSpanControlProvider({ getSpanControls: jest.fn() }, priority)
      }

      mockPlugin1.install = jest.fn(context => {
        populateContext(context, Priority.HIGH)
      })

      mockPlugin2.install = jest.fn(context => {
        populateContext(context, Priority.NORMAL)
      })

      class InstallErrorPlugin implements Plugin<Configuration> {
        install (context: PluginContext<Configuration>) {
          populateContext(context, Priority.LOW)
          throw new Error('Install error')
        }

        start () {}
      }

      const errorPlugin = new InstallErrorPlugin()
      manager.addPlugins([mockPlugin1, errorPlugin, mockPlugin2])

      const config = createConfiguration()
      const mergedContext = manager.installPlugins(config, new IncrementingClock())

      expect(mockPlugin1.install).toHaveBeenCalled()
      expect(mockPlugin2.install).toHaveBeenCalled()
      expect(config.logger.error).toHaveBeenCalledWith('Plugin InstallErrorPlugin failed to install: Error: Install error')

      expect(mergedContext.onSpanStartCallbacks).toEqual([
        { item: expect.any(Function), priority: Priority.HIGH },
        { item: expect.any(Function), priority: Priority.NORMAL }
      ])

      expect(mergedContext.onSpanEndCallbacks).toEqual([
        { item: expect.any(Function), priority: Priority.HIGH },
        { item: expect.any(Function), priority: Priority.NORMAL }
      ])

      expect(mergedContext.spanControlProviders).toEqual([
        { item: expect.any(Object), priority: Priority.HIGH },
        { item: expect.any(Object), priority: Priority.NORMAL }
      ])
    })
  })

  describe('startPlugins', () => {
    it('starts installed plugins', () => {
      manager.addPlugins([mockPlugin1, mockPlugin2])
      manager.installPlugins(createConfiguration(), new IncrementingClock())
      manager.startPlugins()

      expect(mockPlugin1.start).toHaveBeenCalled()
      expect(mockPlugin2.start).toHaveBeenCalled()
    })

    it('handles errors during plugin start', () => {
      class StartErrorPlugin implements Plugin<Configuration> {
        install () { }
        start () { throw new Error('Start error') }
      }

      const errorPlugin = new StartErrorPlugin()
      manager.addPlugins([errorPlugin, mockPlugin1])

      const config = createConfiguration()
      manager.installPlugins(config, new IncrementingClock())
      manager.startPlugins()

      expect(mockPlugin1.start).toHaveBeenCalled()
      expect(config.logger.error).toHaveBeenCalledWith('Plugin StartErrorPlugin failed to start: Error: Start error')
    })
  })

  describe('getPlugin', () => {
    it('retrieves plugin by constructor', () => {
      class TestPlugin implements Plugin<Configuration> {
        install () {}
        start () {}
      }
      const testPlugin = new TestPlugin()

      manager.addPlugins([testPlugin])
      manager.installPlugins(createConfiguration(), new IncrementingClock())

      expect(manager.getPlugin(TestPlugin)).toBe(testPlugin)
    })

    it('returns undefined for non-existent plugin', () => {
      class TestPlugin implements Plugin<Configuration> {
        install () {}
        start () {}
      }

      expect(manager.getPlugin(TestPlugin)).toBeUndefined()
    })
  })
})
