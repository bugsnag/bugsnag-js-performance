import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport'
import { TurboModuleRegistry } from 'react-native'

export type Encoding = 'utf8' | 'base64'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type DeviceInfo = {
  arch?: string
  model?: string
  versionCode?: string // Android only
  bundleVersion?: string // iOS only
  bundleIdentifier?: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type NativeDirs = {
  CacheDir: string // Temporary files. System/user may delete these if device storage is low.
  DocumentDir: string // Persistent data. Generally user created content.
}

export interface Spec extends TurboModule {
  getDeviceInfo: () => DeviceInfo
  requestEntropy: () => string
  requestEntropyAsync: () => Promise<string>
  getNativeConstants: () => NativeDirs
  exists: (path: string) => Promise<boolean>
  isDir: (path: string) => Promise<boolean>
  ls: (path: string) => Promise<string[]>
  mkdir: (path: string) => Promise<string>
  readFile: (path: string, encoding: Encoding) => Promise<string>
  unlink: (path: string) => Promise<void>
  writeFile: (path: string, data: string, encoding: Encoding) => Promise<void>
}

export default TurboModuleRegistry.get<Spec>(
  'BugsnagReactNativePerformance'
) as Spec | null
