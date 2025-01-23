/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport'
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes'
import { TurboModuleRegistry } from 'react-native'

export type DeviceInfo = {
  arch: string | undefined
  model: string | undefined
  versionCode: string | undefined // Android only
  bundleVersion: string | undefined // iOS only
  bundleIdentifier: string | undefined
}

export type NativeDirs = {
  CacheDir: string // Temporary files. System/user may delete these if device storage is low.
  DocumentDir: string // Persistent data. Generally user created content.
}

export type NativeConfiguration = {
  apiKey: string
  endpoint: string
  samplingProbability: number | undefined
  appVersion: string | undefined
  releaseStage: string
  enabledReleaseStages: string[] | undefined
  serviceName: string
  attributeCountLimit: number
  attributeStringValueLimit: number
  attributeArrayLengthLimit: number
}

export type ParentContext = {
  id: string
  traceId: string
}

export type NativeSpan = {
  name: string
  id: string
  traceId: string
  startTime: number
  parentSpanId: string | undefined
}

export interface Spec extends TurboModule {
  getDeviceInfo: () => DeviceInfo | undefined
  requestEntropy: () => string
  requestEntropyAsync: () => Promise<string>
  getNativeConstants: () => NativeDirs
  exists: (path: string) => Promise<boolean>
  isDir: (path: string) => Promise<boolean>
  ls: (path: string) => Promise<string[]>
  mkdir: (path: string) => Promise<string>
  readFile: (path: string, encoding: string) => Promise<string>
  unlink: (path: string) => Promise<void>
  writeFile: (path: string, data: string, encoding: string) => Promise<void>
  isNativePerformanceAvailable: () => boolean
  attachToNativeSDK: () => NativeConfiguration | null
  startNativeSpan: (name: string, options: UnsafeObject) => NativeSpan
  endNativeSpan: (spanId: string, traceId: string, endTime: number, attributes: UnsafeObject) => Promise<void>
  markNativeSpanEndTime: (spanId: string, traceId: string, endTime: number) => void
  discardNativeSpan: (spanId: string, traceId: string) => Promise<void>
}

export default TurboModuleRegistry.get<Spec>(
  'BugsnagReactNativePerformance'
) as Spec | null
