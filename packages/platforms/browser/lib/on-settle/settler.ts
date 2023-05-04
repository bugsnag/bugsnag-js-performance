import { type OnSettleCallback } from '.'

export abstract class Settler {
  protected settled: boolean = false

  private readonly callbacks: Set<OnSettleCallback> = new Set<OnSettleCallback>()

  subscribe (callback: OnSettleCallback): void {
    this.callbacks.add(callback)

    // if we're already settled, call the callback immediately
    if (this.isSettled()) {
      callback()
    }
  }

  unsubscribe (callback: OnSettleCallback): void {
    this.callbacks.delete(callback)
  }

  isSettled (): boolean {
    return this.settled
  }

  protected settle (): void {
    this.settled = true

    for (const callback of this.callbacks) {
      callback()
    }
  }
}
