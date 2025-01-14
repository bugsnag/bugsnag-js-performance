import { TurboModuleRegistry, NativeModules } from 'react-native'
import type { Spec } from './NativeBugsnagPerformance'

declare const global: {
  __turboModuleProxy: any
}

const isTurboModuleEnabled = () => global.__turboModuleProxy != null

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
  writeFile: async (path: string, data: string, encoding: string) => { }
}

export default NativeBugsnagPerformance as Spec
