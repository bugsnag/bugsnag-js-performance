import { TurboModuleRegistry, NativeModules } from 'react-native'
import type { Spec } from './NativeBugsnagPerformance'

declare const global: {
  __turboModuleProxy?: any
  RN$Bridgeless?: boolean
}

const isTurboModuleEnabled = () => global.RN$Bridgeless || global.__turboModuleProxy != null

const NativeBsgModule = isTurboModuleEnabled()
  ? TurboModuleRegistry.get('BugsnagReactNativePerformance')
  : NativeModules.BugsnagReactNativePerformance

const NativeBugsnagPerformance = NativeBsgModule || {
  getDeviceInfo: () => undefined,
  requestEntropy: () => '',
  requestEntropyAsync: async () => '',
  getNativeConstants: () => ({ CacheDir: '', DocumentDir: '' }),
  exists: async (path: string) => false,
  isDir: async (path: string) => false,
  ls: async (path: string) => [],
  mkdir: async (path: string) => '',
  readFile: async (path: string, encoding: string) => '',
  unlink: async (path: string) => { },
  writeFile: async (path: string, data: string, encoding: string) => { },
  isNativePerformanceAvailable: () => false,
  attachToNativeSDK: () => null,
  startNativeSpan: (name: string, options: object) => ({ name, id: '', traceId: '', startTime: 0, parentSpanId: '' }),
  endNativeSpan: async (spanId: string, traceId: string, endTime: number, attributes: object) => { },
  markNativeSpanEndTime: (spanId: string, traceId: string, endTime: number) => { },
  discardNativeSpan: async (spanId: string, traceId: string) => { }
}

export default NativeBugsnagPerformance as Spec
