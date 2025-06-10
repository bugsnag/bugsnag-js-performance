import { TurboModuleRegistry } from 'react-native'
import { SpanQuery, timeToNumber } from '@bugsnag/core-performance'
import type { SpanUpdateTransaction, Spec } from './NativeBugsnagRemoteSpans'
import type { Clock, ParentContext, Plugin, PluginContext, SpanAttribute, SpanControlProvider, Time } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'

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
    public readonly traceId: string,
    private readonly clock: Clock) {
  }

  updateSpan (update: (mutator: NativeSpanMutator) => void): Promise<boolean> {
    const transaction: SpanUpdateTransaction = {
      attributes: [],
      isEnded: false,
      endTime: undefined
    }

    update({
      end: (endTime?: Time) => {
        const safeEndTime = timeToNumber(this.clock, endTime)
        transaction.endTime = this.clock.toUnixNanoseconds(safeEndTime)
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
  constructor (private readonly clock: Clock) {}

  getSpanControls<Q> (query: Q): NativeSpanControl | null {
    if (query instanceof NativeSpanQuery && NativeRemoteSpansModule) {
      const spanId = NativeRemoteSpansModule.getSpanIdByName(query.name)
      if (spanId) {
        return new NativeSpanControlImpl(spanId.spanId, spanId.traceId, this.clock)
      }
    }

    return null
  }
}

export class BugsnagRemoteSpansPlugin implements Plugin<ReactNativeConfiguration> {
  install (context: PluginContext<ReactNativeConfiguration>) {
    const spanControlProvider = new NativeSpanControlProvider(context.clock)
    context.addSpanControlProvider(spanControlProvider)
  }

  start () {}
}
