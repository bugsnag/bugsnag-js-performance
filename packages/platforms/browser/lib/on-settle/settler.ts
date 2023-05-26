import { type Clock } from '@bugsnag/core-performance'
import { type OnSettleCallback } from '.'

export abstract class Settler {
  protected clock: Clock
  protected settled: boolean = false

  private readonly callbacks: Set<OnSettleCallback> = new Set<OnSettleCallback>()

  constructor (clock: Clock) {
    this.clock = clock
  }

  subscribe (callback: OnSettleCallback): void {
    this.callbacks.add(callback)

    // if we're already settled, call the callback immediately
    if (this.isSettled()) {
      callback(this.clock.now())
    }
  }

  unsubscribe (callback: OnSettleCallback): void {
    this.callbacks.delete(callback)
  }

  isSettled (): boolean {
    return this.settled
  }

  protected settle (settledTime: number): void {
    this.settled = true

    for (const callback of this.callbacks) {
      callback(settledTime)
    }
  }
}
