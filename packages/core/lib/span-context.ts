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

export interface SpanContextStorage extends Iterable<SpanContext> {
  push: (context: SpanContext) => void
  pop: (context: SpanContext) => void
  readonly current: SpanContext | undefined
}

class SpanContextIterator implements Iterator<SpanContext> {
  private readonly contexts: SpanContext[]
  private position: number

  constructor (contexts: SpanContext[]) {
    this.contexts = contexts
    this.position = this.contexts.length
  }

  next (): IteratorResult<SpanContext> {
    if (this.position > 0) {
      return {
        done: false,
        value: this.contexts[this.position--]
      }
    } else {
      return {
        done: true,
        value: undefined
      }
    }
  }
}

export class DefaultSpanContextStorage implements SpanContextStorage {
  private readonly contextStack: SpanContext[]

  constructor (contextStack: SpanContext[] = []) {
    this.contextStack = contextStack
  }

  [Symbol.iterator] (): SpanContextIterator {
    return new SpanContextIterator(this.contextStack)
  }

  push (context: SpanContext) {
    if (context.isValid()) {
      this.contextStack.push(context)
    }
  }

  pop (context: SpanContext) {
    if (spanContextEquals(context, this.current)) {
      this.contextStack.pop()
    }

    this.removeClosedContexts()
  }

  get current () {
    this.removeClosedContexts()
    return this.contextStack.length > 0
      ? this.contextStack[this.contextStack.length - 1]
      : undefined
  }

  private removeClosedContexts () {
    while (
      this.contextStack.length > 0 &&
      this.contextStack[this.contextStack.length - 1].isValid() === false
    ) {
      this.contextStack.pop()
    }
  }
}
