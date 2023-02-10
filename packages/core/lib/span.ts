export type Time = Date | number

export interface Span {
  end: (endTime?: Time) => void
}

export interface SpanInternal {
  readonly id: string // 64 bit random string
  readonly name: string
  readonly kind: 'internal' | 'server' | 'client' | 'producer' | 'consumer'
  readonly traceId: string // 128 bit random string
  readonly startTime: number // stored as nanoseconds relative to "start time"
  endTime?: number // stored as nanoseconds relative to "start time" - write once when 'end' is called
}
