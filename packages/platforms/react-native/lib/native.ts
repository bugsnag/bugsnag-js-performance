import { TurboModuleRegistry } from 'react-native'
import type { Spec } from './NativeBugsnagPerformance'

const NativeBugsnagPerformance = TurboModuleRegistry.get('BugsnagReactNativePerformance')

export default NativeBugsnagPerformance as Spec | null
