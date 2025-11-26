/* eslint-disable @typescript-eslint/no-var-requires */
import type { ReactNativeConfiguration } from '../lib/config'
import type { BugsnagPerformance } from '@bugsnag/core-performance'
import type { PlatformExtensions } from '../lib/platform-extensions'
import { IncrementingClock } from '@bugsnag/js-performance-test-utilities'

let client: BugsnagPerformance<ReactNativeConfiguration, PlatformExtensions>

describe('Default React Native Client', () => {
  it('should create a valid client', () => {
    client = require('../lib/client').default

    expect(client).toBeDefined()
    expect(client.start).toBeDefined()
    expect(client.startSpan).toBeDefined()
    expect(client.startNetworkSpan).toBeDefined()
    expect(client.getPlugin).toBeDefined()
    expect(client.getSpanControls).toBeDefined()
    expect(client.startNavigationSpan).toBeDefined()
    expect(client.withInstrumentedAppStarts).toBeDefined()
    expect(client.attach).toBeDefined()
  })
})

describe('singleton behavior', () => {
  beforeEach(() => {
    // Reset modules to clear the singleton
    jest.resetModules()
  })

  it('should allow custom clients to be set and used as default', () => {
    const { registerClient } = require('../lib/client')
    const { createReactNativeClient } = require('../lib/create-client')
    const clock = new IncrementingClock()

    // Import the default client
    const defaultClient = require('../lib/client').default

    // Create and register a custom client
    const testClient = createReactNativeClient({ clock })
    registerClient(testClient)

    // The default should proxy to the test client
    expect(defaultClient.start).toBe(testClient.start)
    expect(defaultClient.startSpan).toBe(testClient.startSpan)
  })

  it('should create default client if none is set', () => {
    const createReactNativeClient = jest.spyOn(require('../lib/create-client'), 'createReactNativeClient')
    const client = require('../lib/client')
    const defaultClient = client.default

    // createReactNativeClient should be called on first access
    expect(createReactNativeClient).not.toHaveBeenCalled()
    expect(defaultClient.start).toBeDefined()
    expect(defaultClient.startSpan).toBeDefined()
    expect(createReactNativeClient).toHaveBeenCalledTimes(1)
  })

  it('should correctly handle getter properties after trap removal', () => {
    const defaultClient = require('../lib/client').default

    // starting a span will trigger trap removal
    const span = defaultClient.startSpan('test-span')

    // Getters such as currentSpanContext should return the current value
    // as opposed to the value at the time of first access
    expect(defaultClient.currentSpanContext).toBeDefined()
    expect(defaultClient.currentSpanContext.id).toBe(span.id)
  })
})
