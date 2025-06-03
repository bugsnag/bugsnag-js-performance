import { TurboModuleRegistry } from 'react-native'
import type { Spec } from './NativeBugsnagRemoteSpans'
import type { ParentContext } from '@bugsnag/core-performance'

export class NativeSpanQuery {
  constructor (public readonly name: string) {
  }
}

export interface NativeSpanControl extends ParentContext {
}

const NativeRemoteSpansModule = TurboModuleRegistry.get<Spec>('BugsnagRemoteSpans')

class NativeSpanControlImpl implements NativeSpanControl {
  constructor (public readonly id: string,
    public readonly traceId: string) {
  }
}

export class NativeSpanControlProvider {
  get (query: any): NativeSpanControl | undefined {
    if (query instanceof NativeSpanQuery && NativeRemoteSpansModule) {
      const spanId = NativeRemoteSpansModule.getSpanIdByName(query.name)
      if (spanId) {
        return new NativeSpanControlImpl(spanId.id, spanId.traceId)
      }
    }

    return undefined
  }
}
