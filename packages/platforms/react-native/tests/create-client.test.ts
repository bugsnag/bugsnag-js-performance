/* eslint-disable @typescript-eslint/no-var-requires */
import {
  InMemoryDelivery,
  IncrementingClock,
  StableIdGenerator,
  ControllableBackgroundingListener,
  resourceAttributesSource,
  spanAttributesSource,
  VALID_API_KEY,
  MockReactNativeSpanFactory
} from '@bugsnag/js-performance-test-utilities'
import { createReactNativeClient } from '../lib/create-client'
import { DefaultSpanContextStorage, InMemoryPersistence } from '@bugsnag/core-performance'
import type { Clock, SpanContextStorage } from '@bugsnag/core-performance'
import { createDefaultPlatformExtensions } from '../lib'
import type { ReactNativeSpanFactory } from '../lib'

jest.useFakeTimers()

describe('createReactNativeClient', () => {
  describe('reactNativeClientOptions', () => {
    it('should accept all custom client options', async () => {
      const clock = new IncrementingClock()
      jest.spyOn(clock, 'now')
      const idGenerator = new StableIdGenerator()
      const backgroundingListener = new ControllableBackgroundingListener()
      const spanContextStorage = new DefaultSpanContextStorage(backgroundingListener)
      const delivery = new InMemoryDelivery()
      const mockDeliveryFactory = jest.fn(() => delivery)
      const mockPersistence = new InMemoryPersistence()
      jest.spyOn(mockPersistence, 'load')
      const mockPlugin = { install: jest.fn(), start: jest.fn() }
      const plugins = jest.fn(() => [mockPlugin])
      const createPlatformExtensions = jest.fn()

      const client = createReactNativeClient({
        clock,
        isDevelopment: false,
        spanContextStorage,
        deliveryFactory: mockDeliveryFactory,
        backgroundingListener,
        idGenerator,
        persistence: mockPersistence,
        resourceAttributesSource,
        spanAttributesSource,
        spanFactory: MockReactNativeSpanFactory,
        plugins,
        createPlatformExtensions
      })

      expect(clock.now).toHaveBeenCalled()
      expect(plugins).toHaveBeenCalled()
      expect(createPlatformExtensions).toHaveBeenCalled()

      client.start({ apiKey: VALID_API_KEY })
      await jest.runOnlyPendingTimersAsync()

      expect(mockDeliveryFactory).toHaveBeenCalled()
      expect(mockPlugin.install).toHaveBeenCalled()
      expect(backgroundingListener.onStateChange).toHaveBeenCalled()
      expect(mockPersistence.load).toHaveBeenCalled()
      expect(spanAttributesSource.configure).toHaveBeenCalled()

      client.startSpan('testSpan').end()
      await jest.runOnlyPendingTimersAsync()

      expect(delivery.requests.length).toBe(1)
      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: 'testSpan',
        spanId: 'a random 64 bit string',
        traceId: 'a random 128 bit string'
      }))

      expect(delivery.requests[0].resourceSpans[0].resource.attributes).toStrictEqual(
        [
          { key: 'deployment.environment', value: { stringValue: 'test' } },
          { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.core' } },
          { key: 'telemetry.sdk.version', value: { stringValue: '1.2.3' } },
          { key: 'service.name', value: { stringValue: 'unknown_service' } },
          { key: 'service.version', value: { stringValue: '3.4.5' } }
        ]
      )
    })
  })

  describe('createPlatformExtensions', () => {
    it('should allow custom extensions to be provided without defaults', () => {
      const customExtensions = () => ({
        customMethod: () => 'test',
        anotherMethod: (x: number) => x * 2
      })

      const client = createReactNativeClient({
        createPlatformExtensions: customExtensions
      })

      expect(client.customMethod()).toBe('test')
      expect(client.anotherMethod(5)).toBe(10)

      // @ts-expect-error startNavigationSpan should not exist on the client type
      expect(client.startNavigationSpan).toBeUndefined()
      // @ts-expect-error startNavigationSpan should not exist on the client type
      expect(client.attach).toBeUndefined()
    })

    it('should allow custom extensions to override default implementations', () => {
      const customExtensions = (appStartTime: number, clock: Clock, spanFactory: ReactNativeSpanFactory, spanContextStorage: SpanContextStorage) => {
        const defaults = createDefaultPlatformExtensions(appStartTime, clock, spanFactory, spanContextStorage)
        return {
          ...defaults,
          attach: () => {
            throw new Error('Attach is not supported in this configuration')
          }
        }
      }

      const client = createReactNativeClient({
        createPlatformExtensions: customExtensions
      })

      expect(client.startNavigationSpan).toBeDefined()
      expect(client.withInstrumentedAppStarts).toBeDefined()
      expect(() => client.attach()).toThrow('Attach is not supported in this configuration')
    })

    it('should allow mixing custom extensions with defaults', () => {
      const customExtensions = (appStartTime: number, clock: Clock, spanFactory: ReactNativeSpanFactory, spanContextStorage: SpanContextStorage) => {
        const defaults = createDefaultPlatformExtensions(appStartTime, clock, spanFactory, spanContextStorage)
        const { attach, ...rest } = defaults
        return {
          ...rest,
          customMethod: () => 'test'
        }
      }

      const client = createReactNativeClient({
        createPlatformExtensions: customExtensions
      })

      expect(client.startNavigationSpan).toBeDefined()
      expect(client.withInstrumentedAppStarts).toBeDefined()
      expect(client.customMethod()).toBe('test')

      // @ts-expect-error startNavigationSpan should not exist on the client type
      expect(client.attach).toBeUndefined()
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
  })
})
