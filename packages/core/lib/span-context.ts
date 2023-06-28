import { type BackgroundingListenerState, type BackgroundingListener } from './backgrounding-listener'

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
  readonly first: SpanContext | undefined
}

export class DefaultSpanContextStorage implements SpanContextStorage {
  private readonly contextStack: SpanContext[]
  private isInForeground: boolean = true

  constructor (backgroundingListener: BackgroundingListener, contextStack: SpanContext[] = []) {
    this.contextStack = contextStack

    backgroundingListener.onStateChange(this.onBackgroundStateChange)
  }

  * [Symbol.iterator] (): Iterator<SpanContext> {
    for (let i = this.contextStack.length - 1; i >= 0; --i) {
      yield this.contextStack[i]
    }
  }

  push (context: SpanContext) {
    if (context.isValid() && this.isInForeground) {
      this.contextStack.push(context)
    }
  }

  pop (context: SpanContext) {
    if (spanContextEquals(context, this.current)) {
      this.contextStack.pop()
    }

    this.removeClosedContexts()
  }

  get first () {
    this.removeClosedContexts()
    return this.contextStack.length > 0
      ? this.contextStack[0]
      : undefined
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

  private onBackgroundStateChange = (state: BackgroundingListenerState) => {
    this.isInForeground = state === 'in-foreground'
    // clear the context stack regardless of the new background state
    // since spans are only valid if they start and end while the app is in the foreground
    this.contextStack.length = 0
  }
}
