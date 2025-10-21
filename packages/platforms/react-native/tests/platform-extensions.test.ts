/**
 * Tests for React Native platform extensions functionality
 */

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { BugsnagPerformance } from '@bugsnag/core-performance'
import { DefaultSpanContextStorage } from '@bugsnag/core-performance'
import { IncrementingClock, InMemoryDelivery, VALID_API_KEY, MockReactNativeSpanFactory, ControllableBackgroundingListener } from '@bugsnag/js-performance-test-utilities'
import { createDefaultPlatformExtensions } from '../lib/platform-extensions'
import type { PlatformExtensions } from '../lib/platform-extensions'
import { createReactNativeClient } from '../lib/create-client'
import type { ReactNativeConfiguration } from '../lib/config'
import type { Spec } from '../lib/NativeBugsnagPerformance'

jest.useFakeTimers()

let client: BugsnagPerformance<ReactNativeConfiguration, PlatformExtensions>
let turboModule: Spec

beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
  turboModule = require('../lib/native').default
})

describe('Platform Extensions', () => {
  describe('createDefaultPlatformExtensions', () => {
    it('should provide all default platform extension methods', () => {
      const platformExtensions = createDefaultPlatformExtensions(0, new IncrementingClock(), new MockReactNativeSpanFactory(), new DefaultSpanContextStorage(new ControllableBackgroundingListener()))

      expect(platformExtensions.startNavigationSpan).toBeDefined()
      expect(typeof platformExtensions.startNavigationSpan).toBe('function')
      expect(platformExtensions.withInstrumentedAppStarts).toBeDefined()
      expect(typeof platformExtensions.withInstrumentedAppStarts).toBe('function')
      expect(platformExtensions.attach).toBeDefined()
      expect(typeof platformExtensions.attach).toBe('function')
    })
  })

  describe('startNavigationSpan', () => {
    it('creates a navigation span with correct name and attributes', async () => {
      const delivery = new InMemoryDelivery()

      const testClient = createReactNativeClient({
        clock: new IncrementingClock(),
        deliveryFactory: () => delivery
      })

      testClient.start({ apiKey: VALID_API_KEY })
      await jest.runOnlyPendingTimersAsync()

      const span = testClient.startNavigationSpan('HomeScreen')

      span.end()
      await jest.runOnlyPendingTimersAsync()

      expect(delivery.requests.length).toBe(1)
      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: '[Navigation]HomeScreen',
        attributes: expect.arrayContaining([
          { key: 'bugsnag.span.category', value: { stringValue: 'navigation' } },
          { key: 'bugsnag.navigation.route', value: { stringValue: 'HomeScreen' } }
        ])
      }))
    })
  })

  describe('attach', () => {
    it('throws an error if native performance is not available', () => {
      turboModule.isNativePerformanceAvailable = jest.fn().mockReturnValue(false)
      client = require('../lib/client').default
      expect(client.attach).toThrow('Could not attach to native SDK. No compatible version of Bugsnag Cocoa Performance was found.')
    })

    it('throws an error if native performance has not been started', () => {
      turboModule.attachToNativeSDK = jest.fn().mockReturnValue(null)
      client = require('../lib/client').default
      expect(client.attach).toThrow('Could not attach to native SDK. Bugsnag Cocoa Performance has not been started.')
    })

    it('starts the client using the native configuration', () => {
      const nativeConfig = turboModule.attachToNativeSDK()
      client = require('../lib/client').default
      const startSpy = jest.spyOn(client, 'start')

      client.attach({
        autoInstrumentAppStarts: false,
        autoInstrumentNetworkRequests: false,
        codeBundleId: '12345',
        logger: console,
        tracePropagationUrls: [/^https:\/\/example\.com/],
        generateAnonymousId: true
      })

      expect(startSpy).toHaveBeenCalledWith({
        apiKey: nativeConfig!.apiKey,
        endpoint: nativeConfig!.endpoint,
        appVersion: nativeConfig!.appVersion,
        releaseStage: nativeConfig!.releaseStage,
        enabledReleaseStages: nativeConfig!.enabledReleaseStages,
        serviceName: nativeConfig!.serviceName,
        attributeCountLimit: nativeConfig!.attributeCountLimit,
        attributeStringValueLimit: nativeConfig!.attributeStringValueLimit,
        attributeArrayLengthLimit: nativeConfig!.attributeArrayLengthLimit,
        autoInstrumentAppStarts: false,
        autoInstrumentNetworkRequests: false,
        codeBundleId: '12345',
        logger: console,
        tracePropagationUrls: [/^https:\/\/example\.com/],
        generateAnonymousId: true
      })
    })

    it('does not overwrite native configuration with JS values', () => {
      const nativeConfig = turboModule.attachToNativeSDK()
      client = require('../lib/client').default
      const startSpy = jest.spyOn(client, 'start')

      client.attach({
        // @ts-expect-error passing properties that do not exist in type 'ReactNativeAttachConfiguration'
        apiKey: 'ignored',
        endpoint: 'ignored',
        releaseStage: 'ignored',
        enabledReleaseStages: ['ignored'],
        serviceName: 'ignored',
        appVersion: 'ignored',
        attributeCountLimit: 0,
        attributeStringValueLimit: 0,
        attributeArrayLengthLimit: 0,
        autoInstrumentAppStarts: false,
        autoInstrumentNetworkRequests: false,
        codeBundleId: '12345',
        logger: console,
        tracePropagationUrls: [/^https:\/\/example\.com/],
        generateAnonymousId: true
      })

      expect(startSpy).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: nativeConfig!.apiKey,
        endpoint: nativeConfig!.endpoint,
        appVersion: nativeConfig!.appVersion,
        releaseStage: nativeConfig!.releaseStage,
        enabledReleaseStages: nativeConfig!.enabledReleaseStages,
        serviceName: nativeConfig!.serviceName,
        attributeCountLimit: nativeConfig!.attributeCountLimit,
        attributeStringValueLimit: nativeConfig!.attributeStringValueLimit,
        attributeArrayLengthLimit: nativeConfig!.attributeArrayLengthLimit,
        autoInstrumentAppStarts: false,
        autoInstrumentNetworkRequests: false,
        codeBundleId: '12345',
        logger: console,
        tracePropagationUrls: [/^https:\/\/example\.com/],
        generateAnonymousId: true
      }))
    })
  })
})
