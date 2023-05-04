export abstract class Settler {
  protected settled: boolean = false

  private readonly callbacks: Set<() => void> = new Set<() => void>()

  subscribe (callback: () => void): void {
    this.callbacks.add(callback)

    // if we're already settled, call the callback immediately
    if (this.isSettled()) {
      callback()
    }
  }

  unsubscribe (callback: () => void): void {
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
