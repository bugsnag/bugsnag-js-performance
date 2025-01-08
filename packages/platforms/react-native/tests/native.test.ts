import NativeBugsnagPerformance from '../lib/native'

jest.mock('react-native', () => {
  return {
    NativeModules: {},
    TurboModuleRegistry: {
      get () {
        return null
      }
    }
  }
})

describe('React Native turbomodule is null so implementation falls back to stub functions', () => {
  afterAll(() => {
    jest.resetModules()
  })
  it('getDeviceInfo returns undefined', () => {
    expect(NativeBugsnagPerformance.getDeviceInfo()).toBeUndefined()
  })

  it('requestEntropy returns an empty string', () => {
    expect(NativeBugsnagPerformance.requestEntropy()).toBe('')
  })

  it('requestEntropyAsync returns an empty string', async () => {
    expect(await NativeBugsnagPerformance.requestEntropyAsync()).toBe('')
  })

  it('getNativeConstants returns an empty string', () => {
    expect(NativeBugsnagPerformance.getNativeConstants()).toStrictEqual({ CacheDir: '', DocumentDir: '' })
  })

  it('exists returns false', async () => {
    expect(await NativeBugsnagPerformance.exists('')).toBe(false)
  })

  it('isDir returns false', async () => {
    expect(await NativeBugsnagPerformance.isDir('')).toBe(false)
  })

  it('ls returns an empty array', async () => {
    expect(await NativeBugsnagPerformance.ls('')).toStrictEqual([])
  })

  it('mkdir returns an empty string', async () => {
    expect(await NativeBugsnagPerformance.mkdir('')).toBe('')
  })

  it('readFile returns an empty string', async () => {
    expect(await NativeBugsnagPerformance.readFile('', '')).toBe('')
  })
})
