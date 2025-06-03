/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport'
import { TurboModuleRegistry } from 'react-native'

export type SpanId = {
  id: string
  traceId: string
}

export interface Spec extends TurboModule {
  getSpanIdByName: (spanName: string) => SpanId | undefined
}

export default TurboModuleRegistry.get<Spec>(
  'BugsnagRemoteSpans'
) as Spec | null
