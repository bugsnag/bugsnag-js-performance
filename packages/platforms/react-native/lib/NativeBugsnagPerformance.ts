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

export type NativePerformanceConfiguration = {
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

export type NativeSettings = {
  device: DeviceInfo
  isNativePerformanceAvailable: boolean
  configuration: NativePerformanceConfiguration | null | undefined
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
  getDeviceInfo: () => DeviceInfo
  requestEntropy: () => string
  requestEntropyAsync: () => Promise<string>
  isNativePerformanceAvailable: () => boolean
  getNativeConfiguration: () => NativePerformanceConfiguration | null
  startNativeSpan: (name: string, options: UnsafeObject) => NativeSpan
  endNativeSpan: (spanId: string, traceId: string, endTime: number, attributes: UnsafeObject) => Promise<void>
  markNativeSpanEndTime: (spanId: string, traceId: string, endTime: number) => void
  discardNativeSpan: (spanId: string, traceId: string) => Promise<void>
  initialise: () => NativeSettings
}

export default TurboModuleRegistry.get<Spec>(
  'BugsnagReactNativePerformance'
) as Spec | null
