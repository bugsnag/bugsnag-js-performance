type Os = 'android' | 'ios' | 'other'
interface SelectOptions<T> { android: T, ios: T, default: T }
type PlatformConstants
  = { Manufacturer: string, Model: string, Release: string }
  | Record<string, never>

const VALID_API_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'

export const Platform = new class {
  private os: Os = 'ios'

  /**
   * A test helper to allow running a test on a different OS without polluting
   * other tests. When the callback finishes the OS will be reset to 'ios'
   *
   * For example:
   *   it('works', async () => {
   *     expect(Platform.OS).toBe('ios')
   *
   *     await Platform.bugsnagWithTestPlatformSetTo('android', async () => {
   *       await doTestStuff()
   *       // etc...
   *       expect(Platform.OS).toBe('android')
   *     })
   *
   *     expect(Platform.OS).toBe('ios')
   *   })
   */
  async bugsnagWithTestPlatformSetTo<T> (os: Os, callback: () => Promise<T>): Promise<T> {
    this.os = os

    try {
      return await callback()
    } finally {
      this.os = 'ios'
    }
  }

  select<T> (options: SelectOptions<T>): T {
    switch (this.os) {
      case 'ios':
        return options.ios

      case 'android':
        return options.android

      case 'other':
        return options.default
    }
  }

  get OS (): Os {
    return this.os
  }

  get Version (): string | number {
    switch (this.os) {
      case 'ios':
        return '1.2.3'

      case 'android':
        return 123

      case 'other':
        return ''
    }
  }

  get constants (): PlatformConstants {
    switch (this.os) {
      case 'ios':
      case 'other':
        // Manufacturer and Model are Android specific and the only constants we
        // currently use
        return {}

      case 'android':
        return {
          Manufacturer: 'bug',
          Model: 'snag',
          Release: 'Snag OS 12'
        }
    }
  }
}()

interface DeviceInfoIos {
  arch: string
  model: string
  bundleVersion: string
  bundleIdentifier: string
}

interface DeviceInfoAndroid {
  arch: string
  model: string
  versionCode: string
  bundleIdentifier: string
}

type DeviceInfo
  = DeviceInfoIos
  | DeviceInfoAndroid
  | Record<string, never>

const createPool = () => {
  return '0123456789abcdef'.repeat(128)
}

const getDevice = (): DeviceInfo => {
  switch (Platform.OS) {
    case 'ios':
      return {
        arch: 'arm64',
        model: 'iPhone14,1',
        bundleVersion: '12345',
        bundleIdentifier: 'my.cool.app'
      }

    case 'android':
      return {
        arch: 'x86',
        model: 'TheGoodPhone1',
        versionCode: '6789',
        bundleIdentifier: 'my.cool.app'
      }

    case 'other':
      return {}
  }
}

const BugsnagReactNativePerformance = {
  getDeviceInfo: jest.fn(getDevice),
  requestEntropy: jest.fn(() => {
    return createPool()
  }),
  requestEntropyAsync: jest.fn(() => {
    return Promise.resolve(createPool())
  }),
  isNativePerformanceAvailable: jest.fn(() => {
    return true
  }),
  getNativeConfiguration: jest.fn(() => {
    return {
      apiKey: VALID_API_KEY,
      endpoint: '/traces',
      appVersion: '1.2.3',
      releaseStage: 'test',
      enabledReleaseStages: ['test', 'production'],
      serviceName: 'com.native.performance.test',
      attributeCountLimit: 128,
      attributeStringValueLimit: 1024,
      attributeArrayLengthLimit: 1000
    }
  }),
  startNativeSpan: jest.fn((name, options) => {
    return {
      name,
      id: 'native-span-id',
      traceId: options.parentContext?.traceId || 'native-trace-id',
      startTime: options.startTime,
      parentSpanId: options.parentContext?.id || undefined
    }
  }),
  endNativeSpan: jest.fn(() => {
    return Promise.resolve()
  }),
  markNativeSpanEndTime: jest.fn(),
  discardNativeSpan: jest.fn(() => {
    return Promise.resolve()
  }),
  getAppStartSpan: jest.fn(() => {
    return {
      name: '[AppStart/ReactNativeInit]',
      id: 'native-app-start-id',
      traceId: 'native-app-start-trace-id',
      startTime: 123456789_000000
    }
  })
}

export const TurboModuleRegistry = {
  get (name: string): typeof BugsnagReactNativePerformance | null {
    switch (name) {
      case 'BugsnagReactNativePerformance':
        return BugsnagReactNativePerformance

      default:
        return null
    }
  }
}

export const NativeModules = {
  BugsnagReactNativePerformance
}

export type AppStateStatus = 'active' | 'inactive' | 'background'
type AppStateChangeCallback = (status: AppStateStatus) => void

export const AppState = new class {
  #status: AppStateStatus = 'active'
  readonly #eventListeners: AppStateChangeCallback[] = []

  addEventListener (event: string, listener: AppStateChangeCallback): void {
    this.#eventListeners.push(listener)
  }

  get currentState (): AppStateStatus {
    return this.#status
  }

  bugsnagChangeAppStateStatus (status: AppStateStatus): void {
    this.#status = status

    for (const listener of this.#eventListeners) {
      listener(this.#status)
    }
  }
}()

export const AppRegistry = {
  setWrapperComponentProvider: jest.fn()
}
