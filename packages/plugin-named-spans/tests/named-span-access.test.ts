import { PluginContext } from '@bugsnag/core-performance'
import { createConfiguration, IncrementingIdGenerator, MockSpanFactory } from '@bugsnag/js-performance-test-utilities'
import type { Configuration } from '@bugsnag/core-performance'
import { BugsnagNamedSpansPlugin, NamedSpanQuery } from '../lib'
import type { IncrementingClock } from '@bugsnag/js-performance-test-utilities'

describe('BugsnagNamedSpansPlugin', () => {
  let plugin: BugsnagNamedSpansPlugin
  let context: PluginContext<Configuration>

  beforeEach(() => {
    jest.useFakeTimers()
    plugin = new BugsnagNamedSpansPlugin()
    context = new PluginContext<Configuration>(
      createConfiguration<Configuration>(),
      { now: jest.fn(() => 1000), toUnixNanoseconds: jest.fn(() => 1000000000) } as unknown as IncrementingClock
    )

    // Install the plugin to the context
    plugin.install(context)
    // plugin.start()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should add callbacks during installation', () => {
    // Spy on context methods
    const addOnSpanStartCallbackSpy = jest.spyOn(context, 'addOnSpanStartCallback')
    const addOnSpanEndCallbackSpy = jest.spyOn(context, 'addOnSpanEndCallback')
    const addSpanControlProviderSpy = jest.spyOn(context, 'addSpanControlProvider')

    // Create a new plugin and install it
    const newPlugin = new BugsnagNamedSpansPlugin()
    newPlugin.install(context)

    // Verify the callbacks were added
    expect(addOnSpanStartCallbackSpy).toHaveBeenCalledTimes(1)
    expect(addOnSpanEndCallbackSpy).toHaveBeenCalledTimes(1)
    expect(addSpanControlProviderSpy).toHaveBeenCalledTimes(1)
  })

  it('should track spans when onSpanStart is called', () => {
    // Create a mock span
    const mockSpan = {
      name: 'testSpan',
      isValid: jest.fn(() => true),
      end: jest.fn(),
      id: '123',
      traceId: '456',
      setAttribute: jest.fn()
    }

    // Call onSpanStart with the mock span
    plugin.onSpanStart(mockSpan as any)

    // Verify the span was added to the spansByName map by using getSpanControls
    const retrievedSpan = plugin.getSpanControls(new NamedSpanQuery('testSpan'))

    expect(retrievedSpan).toBe(mockSpan)
  })

  it('should only track the latest span for a given span name', () => {
    const spanFactory = new MockSpanFactory()
    const firstSpan = spanFactory.toPublicApi(spanFactory.startSpan('testSpan', {}))

    // Notify the plugin of the first span
    plugin.onSpanStart(firstSpan)

    // Verify span is tracked
    let retrievedSpan = plugin.getSpanControls(new NamedSpanQuery('testSpan'))
    expect(retrievedSpan).toBe(firstSpan)

    // Add a second span with the same name
    const secondSpan = spanFactory.toPublicApi(spanFactory.startSpan('testSpan', {}))
    plugin.onSpanStart(secondSpan)

    // Verify that the second span is now tracked
    retrievedSpan = plugin.getSpanControls(new NamedSpanQuery('testSpan'))
    expect(retrievedSpan).toBe(secondSpan)
  })

  it('should remove spans when onSpanEnd is called', () => {
    // Create a mock span
    const mockSpan = {
      name: 'testSpan',
      isValid: jest.fn(() => true),
      end: jest.fn(),
      id: '123',
      traceId: '456',
      setAttribute: jest.fn()
    }

    // Add span to tracking
    plugin.onSpanStart(mockSpan as any)

    // Verify span is tracked
    const retrievedSpan = plugin.getSpanControls(new NamedSpanQuery('testSpan'))

    expect(retrievedSpan).toBe(mockSpan)

    // Call onSpanEnd to remove the span
    const result = plugin.onSpanEnd(mockSpan as any)

    // Verify span is removed
    expect(plugin.getSpanControls(new NamedSpanQuery('testSpan'))).toBeNull()
    expect(result).toBe(true)
  })

  it('should only remove ended spans if they are currently being tracked', () => {
    const spanFactory = new MockSpanFactory({ idGenerator: new IncrementingIdGenerator() })
    const firstSpan = spanFactory.toPublicApi(spanFactory.startSpan('testSpan', {}))

    // Notify the plugin of the first span
    plugin.onSpanStart(firstSpan)

    // Verify span is tracked
    let retrievedSpan = plugin.getSpanControls(new NamedSpanQuery('testSpan'))
    expect(retrievedSpan).toBe(firstSpan)

    // Add a second span with the same name
    const secondSpan = spanFactory.toPublicApi(spanFactory.startSpan('testSpan', {}))
    plugin.onSpanStart(secondSpan)

    // End the first span
    firstSpan.end()
    plugin.onSpanEnd(firstSpan)

    // Verify that the second span is still tracked
    retrievedSpan = plugin.getSpanControls(new NamedSpanQuery('testSpan'))
    expect(retrievedSpan).toBe(secondSpan)
  })

  it('should return null for spans that do not exist', () => {
    // Attempt to retrieve a span that doesn't exist
    const retrievedSpan = plugin.getSpanControls(new NamedSpanQuery('nonExistentSpan'))
    expect(retrievedSpan).toBeNull()
  })

  it('should return null for queries that are not NamedSpanQuery', () => {
    // Create a different type of query
    const differentQuery = { type: 'different' }

    // Attempt to retrieve using the different query
    const retrievedSpan = plugin.getSpanControls(differentQuery)
    expect(retrievedSpan).toBeNull()
  })

  it('should clean up invalid spans on start', () => {
    // Create mock spans - one valid and one invalid
    const spanFactory = new MockSpanFactory()
    const validSpan = spanFactory.toPublicApi(spanFactory.startSpan('validSpan', {}))
    const invalidSpan = spanFactory.toPublicApi(spanFactory.startSpan('invalidSpan', {}))

    // Add spans to tracking
    plugin.onSpanStart(validSpan)
    plugin.onSpanStart(invalidSpan)

    // Verify both spans are tracked initially
    let retrievedValidSpan = plugin.getSpanControls(new NamedSpanQuery('validSpan'))
    let retrievedInvalidSpan = plugin.getSpanControls(new NamedSpanQuery('invalidSpan'))

    expect(retrievedValidSpan).toBe(validSpan)
    expect(retrievedInvalidSpan).toBe(invalidSpan)

    // Invalidate the span and call start to trigger the cleanup (which calls cleanup)
    invalidSpan.end()
    plugin.start()

    // Only valid spans should remain
    retrievedValidSpan = plugin.getSpanControls(new NamedSpanQuery('validSpan'))
    retrievedInvalidSpan = plugin.getSpanControls(new NamedSpanQuery('invalidSpan'))

    expect(retrievedValidSpan).toBe(validSpan)
    expect(retrievedInvalidSpan).toBeNull()
  })

  it('should clean up invalid spans every hour', () => {
    // Spy on setTimeout
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

    plugin.start()

    // Verify setTimeout was called with the cleanup method
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1)

    const spanFactory = new MockSpanFactory()
    const span1 = spanFactory.toPublicApi(spanFactory.startSpan('span1', {}))
    const span2 = spanFactory.toPublicApi(spanFactory.startSpan('span2', {}))

    // Add spans to the plugin
    plugin.onSpanStart(span1)
    plugin.onSpanStart(span2)

    const retrievedSpan1 = plugin.getSpanControls(new NamedSpanQuery('span1'))
    const retrievedSpan2 = plugin.getSpanControls(new NamedSpanQuery('span2'))
    expect(retrievedSpan1).not.toBeNull()
    expect(retrievedSpan2).not.toBeNull()

    span2.end()

    // Simulate the passage of time to trigger the cleanup
    jest.advanceTimersByTime(60 * 60 * 1000) // 1 hour in milliseconds

    expect(setTimeoutSpy).toHaveBeenCalledTimes(2)
    expect(plugin.getSpanControls(new NamedSpanQuery('span1'))).not.toBeNull()
    expect(plugin.getSpanControls(new NamedSpanQuery('span2'))).toBeNull()
  })
})
