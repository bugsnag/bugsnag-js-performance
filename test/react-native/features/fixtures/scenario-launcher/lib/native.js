import { TurboModuleRegistry, NativeModules } from 'react-native'

const isTurboModuleEnabled = () => global.RN$Bridgeless || global.__turboModuleProxy != null

export const NativeScenarioLauncher = isTurboModuleEnabled()
    ? TurboModuleRegistry.get('ScenarioLauncher')
    : NativeModules.ScenarioLauncher
