import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport'
import { TurboModuleRegistry } from 'react-native'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type DeviceInfo = {
  arch: string | undefined
  model: string | undefined
  versionCode: string | undefined // Android only
  bundleVersion: string | undefined // iOS only
  bundleIdentifier: string | undefined
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type NativeConfiguration = {
  apiKey: string
  endpoint: string
  samplingProbability?: number
  appVersion?: string
  releaseStage: string
  enabledReleaseStages?: string[]
  serviceName: string
  attributeCountLimit: number
  attributeStringValueLimit: number
  attributeArrayLengthLimit: number
}

export interface Spec extends TurboModule {
  getDeviceInfo: () => DeviceInfo
  requestEntropy: () => string
  requestEntropyAsync: () => Promise<string>
  isNativePerformanceAvailable: () => boolean
  getNativeConfiguration: () => NativeConfiguration | null
}

export default TurboModuleRegistry.get<Spec>(
  'BugsnagReactNativePerformance'
) as Spec | null
