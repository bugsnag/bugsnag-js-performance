import type { Encoding, Spec } from '../NativeBugsnagPerformance'
import { NativeModules } from 'react-native'

const LINKING_ERROR =
  'The package \'BugsnagReactNativePerformance\' doesn\'t seem to be linked.'

// @ts-expect-error check if turbomodule is enabled
const isTurboModuleEnabled = global.__turboModuleProxy != null

const BugsnagFileAccessModule = isTurboModuleEnabled
  ? require('./NativeBugsnagPerformance').default
  : NativeModules.BugsnagReactNativePerformance

const BugsnagFileAccessNative: Spec = BugsnagFileAccessModule || new Proxy(
  {},
  {
    get () {
      throw new Error(LINKING_ERROR)
    }
  }
)

export const Dirs: {
  CacheDir: string
  DocumentDir: string
} = BugsnagFileAccessModule
  ? BugsnagFileAccessNative.getNativeConstants()
  : { CacheDir: '', DocumentDir: '' }

export const FileSystem = {
  exists (path: string) {
    return BugsnagFileAccessNative.exists(path)
  },
  isDir (path: string) {
    return BugsnagFileAccessNative.isDir(path)
  },
  ls (path: string) {
    return BugsnagFileAccessNative.ls(path)
  },
  mkdir (path: string) {
    return BugsnagFileAccessNative.mkdir(path)
  },
  readFile (path: string, encoding: Encoding = 'utf8') {
    return BugsnagFileAccessNative.readFile(path, encoding)
  },
  unlink (path: string) {
    return BugsnagFileAccessNative.unlink(path)
  },
  writeFile (path: string, data: string, encoding: Encoding = 'utf8') {
    return BugsnagFileAccessNative.writeFile(path, data, encoding)
  }
}
