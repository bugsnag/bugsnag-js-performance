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

describe('PluginManager', () => {
  let manager: PluginManager<Configuration>
  let config: Configuration
  let context: PluginContext<Configuration>
  let mockPlugin1: Plugin<Configuration>
  let mockPlugin2: Plugin<Configuration>

  beforeEach(() => {
    config = createConfiguration()
    manager = new PluginManager()
    context = new PluginContext(config, new IncrementingClock())
    mockPlugin1 = { install: jest.fn(), start: jest.fn() }
    mockPlugin2 = { install: jest.fn(), start: jest.fn() }
  })

  it('installs plugins correctly', () => {
    manager.addPlugins([mockPlugin1, mockPlugin2])
    manager.installPlugins(context)

    expect(mockPlugin1.install).toHaveBeenCalledWith(context)
    expect(mockPlugin2.install).toHaveBeenCalledWith(context)
  })

  it('does not reinstall already installed plugins', () => {
    manager.addPlugins([mockPlugin1])
    manager.installPlugins(context)
    manager.installPlugins(context)

    expect(mockPlugin1.install).toHaveBeenCalledTimes(1)
  })

  it('starts installed plugins', () => {
    manager.addPlugins([mockPlugin1, mockPlugin2])
    manager.installPlugins(context)
    manager.startPlugins()

    expect(mockPlugin1.start).toHaveBeenCalled()
    expect(mockPlugin2.start).toHaveBeenCalled()
  })

  it('handles errors during plugin installation', () => {
    class InstallErrorPlugin implements Plugin<Configuration> {
      install () { throw new Error('Install error') }
      start () {}
    }

    const errorPlugin = new InstallErrorPlugin()
    manager.addPlugins([errorPlugin, mockPlugin1])
    manager.installPlugins(context)

    expect(mockPlugin1.install).toHaveBeenCalled()
    expect(config.logger?.error).toHaveBeenCalledWith('Plugin InstallErrorPlugin failed to install: Error: Install error')
  })

  it('handles errors during plugin start', () => {
    class StartErrorPlugin implements Plugin<Configuration> {
      install () { }
      start () { throw new Error('Start error') }
    }

    const errorPlugin = new StartErrorPlugin()
    manager.addPlugins([errorPlugin, mockPlugin1])
    manager.installPlugins(context)
    manager.startPlugins()

    expect(mockPlugin1.start).toHaveBeenCalled()
    expect(config.logger?.error).toHaveBeenCalledWith('Plugin StartErrorPlugin failed to start: Error: Start error')
  })

  it('retrieves plugin by constructor', () => {
    class TestPlugin implements Plugin<Configuration> {
      install () {}
      start () {}
    }
    const testPlugin = new TestPlugin()

    manager.addPlugins([testPlugin])
    manager.installPlugins(context)

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
