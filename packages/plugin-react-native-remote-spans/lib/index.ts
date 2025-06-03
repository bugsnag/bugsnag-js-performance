import { TurboModuleRegistry } from 'react-native'
import { SpanQuery } from '@bugsnag/core-performance/lib/span-control-provider'
import type { SpanUpdateTransaction, Spec } from './NativeBugsnagRemoteSpans'
import type { ParentContext, SpanAttribute, Time } from '@bugsnag/core-performance'
import type { SpanControlProvider } from '@bugsnag/core-performance/lib/span-control-provider'

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
      endTimestamp: undefined,
      endDatetime: undefined
    }

    update({
      end: (endTime?: Time) => {
        if (endTime instanceof Date) {
          transaction.endDatetime = endTime.toISOString()
        } else {
          // FIXME: This needs to be clock.toUnixTimestampNanoseconds(endTime)
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
