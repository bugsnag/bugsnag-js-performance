import { TurboModuleRegistry } from 'react-native'
import { SpanQuery, timeToNumber } from '@bugsnag/core-performance'
import type { Spec } from './NativeBugsnagNativeSpans'
import type { Clock, ParentContext, Plugin, PluginContext, SpanAttribute, SpanControlProvider, Time } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'

export class NativeSpanQuery extends SpanQuery<NativeSpanControl> {
  constructor (public readonly name: string) {
    super()
  }
}

export interface NativeSpanMutator {
  end: (endTime?: Time) => void
  setAttribute: (name: string, value?: SpanAttribute) => void
}

export interface NativeSpanControl extends ParentContext {
  updateSpan: (update: (mutator: NativeSpanMutator) => void) => Promise<boolean>
}

const NativeNativeSpansModule = TurboModuleRegistry.get<Spec>('BugsnagNativeSpans')

interface SpanTransaction {
  attributes: Array<{ name: string, value?: SpanAttribute | null }>
  isEnded: boolean
  endTime?: number
}

interface SpanId {
  spanId: string
  traceId: string
}

class NativeSpanControlImpl implements NativeSpanControl {
  constructor (
    public readonly id: string,
    public readonly traceId: string,
    private readonly clock: Clock
  ) {}

  updateSpan (update: (mutator: NativeSpanMutator) => void): Promise<boolean> {
    const transaction: SpanTransaction = {
      attributes: [],
      isEnded: false
    }

    update({
      end: (endTime?: Time) => {
        const safeEndTime = timeToNumber(this.clock, endTime)
        transaction.endTime = this.clock.toUnixNanoseconds(safeEndTime)
        transaction.isEnded = true
      },
      setAttribute: (name: string, value?: SpanAttribute | null) => {
        transaction.attributes.push({ name, value })
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return NativeNativeSpansModule!.updateSpan({ spanId: this.id, traceId: this.traceId }, transaction)
  }
}

export class NativeSpanControlProvider implements SpanControlProvider<NativeSpanControl> {
  constructor (private readonly clock: Clock) {}

  getSpanControls<Q> (query: Q): NativeSpanControl | null {
    if (query instanceof NativeSpanQuery && NativeNativeSpansModule) {
      const spanId: SpanId | undefined =
          NativeNativeSpansModule.getSpanIdByName(query.name) as
              unknown as SpanId | undefined
      if (spanId) {
        return new NativeSpanControlImpl(spanId.spanId, spanId.traceId, this.clock)
      }
    }

    return null
  }
}

export class BugsnagNativeSpansPlugin implements Plugin<ReactNativeConfiguration> {
  install (context: PluginContext<ReactNativeConfiguration>) {
    const spanControlProvider = new NativeSpanControlProvider(context.clock)
    context.addSpanControlProvider(spanControlProvider)
  }

  start () {}
}
