export interface SpanContext {
  readonly id: string // 64 bit random string
  readonly traceId: string // 128 bit random string

  // returns true if this is still considered a valid context
  readonly isValid: () => boolean
}

export function spanContextEquals (span1?: SpanContext, span2?: SpanContext) {
  if (span1 === span2) return true

  if (span1 !== undefined && span2 !== undefined) {
    return span1.id === span2.id && span1.traceId === span2.traceId
  }

  return false
}

