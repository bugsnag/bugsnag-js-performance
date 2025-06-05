import { TurboModuleRegistry } from 'react-native'
import { SpanQuery } from '@bugsnag/core-performance'
import type { SpanUpdateTransaction, Spec } from './NativeBugsnagRemoteSpans'
import type { ParentContext, SpanAttribute, SpanControlProvider, Time } from '@bugsnag/core-performance'

export class NativeSpanQuery extends SpanQuery<NativeSpanControl> {
  constructor (public readonly name: string) {
    super()
  }
}

export interface NativeSpanMutator {
  end: (endTime?: Time) => void
  setAttribute: (name: string, value: SpanAttribute) => void
}

export interface NativeSpanControl extends ParentContext {
  updateSpan: (update: (mutator: NativeSpanMutator) => void) => Promise<boolean>
}

const NativeRemoteSpansModule = TurboModuleRegistry.get<Spec>('BugsnagRemoteSpans')

class NativeSpanControlImpl implements NativeSpanControl {
  constructor (
    public readonly id: string,
    public readonly traceId: string) {
  }

  updateSpan (update: (mutator: NativeSpanMutator) => void): Promise<boolean> {
    const transaction: SpanUpdateTransaction = {
      attributes: [],
      isEnded: false,
      endTimestamp: undefined
    }

    update({
      end: (endTime?: Time) => {
        if (endTime !== undefined && endTime !== null) {
          // TODO: This needs to be timeToNumber(clock, endTime)
          transaction.endTimestamp = endTime?.toString()
        }

        transaction.isEnded = true
      },
      setAttribute: (name: string, value: SpanAttribute) => {
        transaction.attributes.push({ name, value: value as any })
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return NativeRemoteSpansModule!.updateSpan({ spanId: this.id, traceId: this.traceId }, transaction)
  }
}

export class NativeSpanControlProvider implements SpanControlProvider<NativeSpanControl> {
  getSpanControls<Q> (query: Q): NativeSpanControl | null {
    if (query instanceof NativeSpanQuery && NativeRemoteSpansModule) {
      const spanId = NativeRemoteSpansModule.getSpanIdByName(query.name)
      if (spanId) {
        return new NativeSpanControlImpl(spanId.spanId, spanId.traceId)
      }
    }

    return null
  }
}
