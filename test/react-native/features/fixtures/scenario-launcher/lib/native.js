import { TurboModuleRegistry, NativeModules } from 'react-native'

const isTurboModuleEnabled = () => global.__turboModuleProxy != null

export const NativeScenarioLauncher = isTurboModuleEnabled()
    ? TurboModuleRegistry.get('ScenarioLauncher')
    : NativeModules.ScenarioLauncher
