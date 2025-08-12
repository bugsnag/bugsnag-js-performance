import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport'
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes'
import { TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  getSpanIdByName: (spanName: string) => UnsafeObject | undefined

  updateSpan: (spanId: UnsafeObject, updates: UnsafeObject) => Promise<boolean>
}

export default TurboModuleRegistry.get<Spec>(
  'BugsnagNativeSpans'
) as Spec | null
