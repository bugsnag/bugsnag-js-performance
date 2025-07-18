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

describe('NativeBugsnagPerformance', () => {
  afterAll(() => {
    jest.resetModules()
  })

  it('falls back to stub functions when native module is null', async () => {
    expect(NativeBugsnagPerformance.getDeviceInfo()).toBeUndefined()
    expect(NativeBugsnagPerformance.requestEntropy()).toBe('')
    expect(await NativeBugsnagPerformance.requestEntropyAsync()).toBe('')
    expect(NativeBugsnagPerformance.getNativeConstants()).toStrictEqual({ CacheDir: '', DocumentDir: '' })
    expect(await NativeBugsnagPerformance.exists('')).toBe(false)
    expect(await NativeBugsnagPerformance.isDir('')).toBe(false)
    expect(await NativeBugsnagPerformance.ls('')).toStrictEqual([])
    expect(await NativeBugsnagPerformance.mkdir('')).toBe('')
    expect(await NativeBugsnagPerformance.readFile('', '')).toBe('')
    await expect(NativeBugsnagPerformance.unlink('')).resolves.toBeUndefined()
    await expect(NativeBugsnagPerformance.writeFile('', '', '')).resolves.toBeUndefined()
    expect(NativeBugsnagPerformance.isNativePerformanceAvailable()).toBe(false)
    expect(NativeBugsnagPerformance.attachToNativeSDK()).toBeNull()
    expect(NativeBugsnagPerformance.startNativeSpan('', {})).toStrictEqual({ name: '', id: '', traceId: '', startTime: '0', parentSpanId: '' })
    await expect(NativeBugsnagPerformance.endNativeSpan('', '', '0', {})).resolves.toBeUndefined()
    await expect(NativeBugsnagPerformance.discardNativeSpan('', '')).resolves.toBeUndefined()
    expect(() => { NativeBugsnagPerformance.markNativeSpanEndTime('', '', '0') }).not.toThrow()
  })
})
