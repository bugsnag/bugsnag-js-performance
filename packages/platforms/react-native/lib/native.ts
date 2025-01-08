import { TurboModuleRegistry, NativeModules } from 'react-native'
import type { Spec } from './NativeBugsnagPerformance'

declare const global: {
  __turboModuleProxy: any
}

const isTurboModuleEnabled = () => global.__turboModuleProxy != null

const LINKING_ERROR =
  'The package \'BugsnagReactNativePerformance\' doesn\'t seem to be linked.'

export const NativeBsgModule = isTurboModuleEnabled()
  ? TurboModuleRegistry.get('BugsnagReactNativePerformance')
  : NativeModules.BugsnagReactNativePerformance

const NativeBugsnagPerformance = NativeBsgModule || new Proxy(
  {
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
  },
  {
    get () {
      throw new Error(LINKING_ERROR)
    }
  }
)

export default NativeBugsnagPerformance as Spec
