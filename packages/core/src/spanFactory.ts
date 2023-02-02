import { randomUUID } from 'crypto'
import { Attributes, Span, SpanKind, Time } from './types'

interface NewSpanParams {
    name: string
    startTime?: Time
    kind?: SpanKind
    traceId?: string
    attributes?: Attributes
}

export function spanFactory(clock: () => number, destination: (span: Span) => void) {
  class SpanImpl implements Span {
    // FIXME: This is not where we want this code, but we want to bind `clock` and `destination` nicely
    public endTime?: Time

    constructor(
            public readonly id: string,
            public readonly kind: SpanKind,
            public name: string,
            public readonly startTime: Time,
            public readonly traceId: string,
            public attributes: Attributes
    ) {
    }

    end(endTime?: Time): void {
      if (this.endTime === undefined) {
        return
      }

      const safeEndTime = (endTime instanceof Date || typeof endTime === 'number') ? endTime : undefined
      this.endTime = safeEndTime || clock()

      destination(this)
    }
  }

  return {
    newSpan: (params: NewSpanParams): Span => {
      // FIXME: validate params
      return new SpanImpl(
        randomUUID(),
        params.kind || 'internal',
        params.name,
        params.startTime || clock(),
        params.traceId || randomUUID(),
        params.attributes || {}
      )
    }
  }
}

export type SpanFactory = ReturnType<typeof spanFactory>

export default spanFactory
