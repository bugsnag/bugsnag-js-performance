import { TurboModuleRegistry, NativeModules } from 'react-native'
import type { Spec } from './NativeBugsnagPerformance'

declare const global: {
  __turboModuleProxy: any
}

const isTurboModuleEnabled = () => global.__turboModuleProxy != null

export const NativeBugsnagPerformance = isTurboModuleEnabled()
  ? TurboModuleRegistry.get('BugsnagReactNativePerformance')
  : NativeModules.BugsnagReactNativePerformance

export default NativeBugsnagPerformance as Spec | null
