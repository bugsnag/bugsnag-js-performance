import { type TurboModule, TurboModuleRegistry } from 'react-native'

interface DeviceInfo {
  arch?: string
  versionCode?: string
  bundleVersion?: string
}

interface BugsnagReactNativePerformance extends TurboModule {
  getDeviceInfo: () => DeviceInfo
}

const NativeBugsnagPerformance = TurboModuleRegistry.get('BugsnagReactNativePerformance') || undefined

export default NativeBugsnagPerformance as unknown as BugsnagReactNativePerformance
