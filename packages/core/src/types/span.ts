import { Time } from './time'

export type SpanKind = 'internal' | 'server' | 'something'

export interface Span {
    readonly id: string // Stricly 64 bits
    name: string
    readonly kind: SpanKind
    readonly traceId: string // Stricly 128 bits
    readonly startTime: Time // this should be a number, but is beyond the scope of this experiment
    readonly endTime?: Time // this should be a number, but is beyond the scope of this experiment
    // attributes: Attributes
    end: (endTime?: Time) => void
}
