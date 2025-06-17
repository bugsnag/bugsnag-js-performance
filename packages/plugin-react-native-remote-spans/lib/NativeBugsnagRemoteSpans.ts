/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport'
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes'
import { TurboModuleRegistry } from 'react-native'

export type SpanId = {
  spanId: string
  traceId: string
}

type SpanAttribute = {
  name: string
  value: UnsafeObject
}

export type SpanUpdateTransaction = {
  attributes: SpanAttribute[]
  isEnded: boolean
  endTime: number | undefined
}

export interface Spec extends TurboModule {
  getSpanIdByName: (spanName: string) => SpanId | undefined

  updateSpan: (spanId: UnsafeObject, updates: UnsafeObject) => Promise<boolean>
}

export default TurboModuleRegistry.get<Spec>(
  'BugsnagRemoteSpans'
) as Spec | null
