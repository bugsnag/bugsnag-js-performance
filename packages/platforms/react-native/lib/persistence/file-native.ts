import type { Spec } from '../NativeBugsnagPerformance'
import NativeBugsnagPerformance from '../native'

const LINKING_ERROR =
  'The package \'BugsnagReactNativePerformance\' doesn\'t seem to be linked.'

type FileAccessType = Pick<Spec, 'getNativeConstants' | 'exists' | 'isDir' | 'ls' | 'mkdir' | 'readFile' | 'writeFile' | 'unlink'>

const BugsnagFileAccessNative: FileAccessType = NativeBugsnagPerformance || new Proxy(
  {
    getNativeConstants: () => ({ CacheDir: '', DocumentDir: '' }),
    exists: async (path: string) => false,
    isDir: async (path: string) => false,
    ls: async (path: string) => [],
    mkdir: async (path: string) => '',
    readFile: async (path: string, encoding: string) => '',
    unlink: async (path: string) => {},
    writeFile: async (path: string, data: string, encoding: string) => {}
  },
  {
    get () {
      throw new Error(LINKING_ERROR)
    }
  }
)

export const Dirs: {
  CacheDir: string
  DocumentDir: string
} = NativeBugsnagPerformance
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
  readFile (path: string, encoding: string = 'utf8') {
    return BugsnagFileAccessNative.readFile(path, encoding)
  },
  unlink (path: string) {
    return BugsnagFileAccessNative.unlink(path)
  },
  writeFile (path: string, data: string, encoding: string = 'utf8') {
    return BugsnagFileAccessNative.writeFile(path, data, encoding)
  }
}
