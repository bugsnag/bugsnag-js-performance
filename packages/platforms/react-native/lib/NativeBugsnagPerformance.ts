import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport'
import { TurboModuleRegistry } from 'react-native'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type DeviceInfo = {
  arch?: string
  model?: string
  versionCode?: string // Android only
  bundleVersion?: string // iOS only
}

export interface Spec extends TurboModule {
  getDeviceInfo: () => DeviceInfo
}

export default TurboModuleRegistry.get<Spec>(
  'BugsnagReactNativePerformance'
) as Spec | null