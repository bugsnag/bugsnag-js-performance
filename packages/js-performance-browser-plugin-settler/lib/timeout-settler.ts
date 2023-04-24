import { type Settler } from './settler'

class TimeoutSettler implements Settler {
  private settled: boolean = false
  private callbacks: Array<() => void> = []

  constructor (timeoutMilliseconds: number) {
    setTimeout(() => {
      this.settled = true

      for (const callback of this.callbacks) {
        callback()
      }
    }, timeoutMilliseconds)
  }

  subscribe (callback: () => void): void {
    this.callbacks.push(callback)

    // if we're already settled, call the callback immediately
    if (this.settled) {
      callback()
    }
  }
}

export default TimeoutSettler
