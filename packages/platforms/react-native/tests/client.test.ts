/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ReactNativeConfiguration } from '../lib/config'
import type { BugsnagPerformance } from '@bugsnag/core-performance'
import type { PlatformExtensions } from '../lib/platform-extensions'
import type { Spec } from '../lib/NativeBugsnagPerformance'

// trick the client in thinking it's not running in the remote debugger
// @ts-expect-error 'typeof globalThis' has no index signature
global.nativeCallSyncHook = () => {}

let client: BugsnagPerformance<ReactNativeConfiguration, PlatformExtensions>
let turboModule: Spec
const RESPONSE_TIME = 100

const response = {
  status: 200,
  headers: new Headers({ 'Bugsnag-Sampling-Probability': '1.0' })
}

const createMockFetch = () => jest.fn().mockImplementation(() => new Promise((resolve) => {
  setTimeout(() => {
    resolve(response)
  }, RESPONSE_TIME)
}))

let mockFetch: ReturnType<typeof createMockFetch>

class XMLHttpRequest {
  _listeners: { load: Array<() => void>, error: Array<() => void> }
  status: number | null

  constructor () {
    this._listeners = { load: [], error: [] }
    this.status = null
  }

  open (method: string, url: string | { toString: () => any }) {
  }

  send (fail: boolean, status: number | null = null) {
    if (fail) {
      this?._listeners.error.forEach(fn => { fn() })
    } else {
      this.status = status
      this?._listeners.load.forEach(fn => { fn() })
    }
  }

  addEventListener (evt: 'load' | 'error', listener: () => void) {
    this?._listeners[evt].push(listener)
  }

  removeEventListener (evt: 'load' | 'error', listener: () => void) {
    for (let i = this?._listeners?.[evt]?.length ?? 0 - 1; i >= 0; i--) {
      if (listener.name === this?._listeners?.[evt]?.[i]?.name) delete this?._listeners[evt][i]
    }
  }
}

global.XMLHttpRequest = XMLHttpRequest as unknown as typeof globalThis.XMLHttpRequest

beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
  mockFetch = createMockFetch()
  global.fetch = mockFetch
  turboModule = require('../lib/native').default
})

describe('React Native client tests', () => {
  describe('attach()', () => {
    it('logs a warning and noops if native performance is not available', () => {
      turboModule.initialise = jest.fn().mockReturnValue({
        isNativePerformanceAvailable: false,
        configuration: null
      })

      client = require('../lib/client').default
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      client.attach({})
      expect(warnSpy).toHaveBeenCalledWith('Could not attach to native SDK. No compatible version of Bugsnag Cocoa Performance was found.')
    })

    it('logs a warning and noops if native performance has not been started', () => {
      turboModule.initialise = jest.fn().mockReturnValue({
        isNativePerformanceAvailable: true,
        configuration: null
      })

      client = require('../lib/client').default
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      client.attach()
      expect(warnSpy).toHaveBeenCalledWith('Could not attach to native SDK. Bugsnag Cocoa Performance has not been started.')
    })

    it('starts the client using the native configuration', () => {
      const nativeConfig = turboModule.initialise().configuration
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
      const nativeConfig = turboModule.initialise().configuration
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
