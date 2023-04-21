export interface Subscription {
  unsubscribe: () => void
}

class EventEmitter<T> {
  private callbacks: Array<(data: T) => void> = []
  private uninitalise?: () => void

  constructor (private initialise?: () => (() => void)) {}

  subscribe (callback: (data: T) => void): Subscription {
    // initialize the event emitter on first subscription
    if (!this.callbacks.length && this.initialise) {
      this.uninitalise = this.initialise() || undefined
    }

    this.callbacks.push(callback)

    return {
      unsubscribe: () => {
        this.callbacks = this.callbacks.filter((other) => callback !== other)
        if (!this.callbacks.length) this.uninitalise?.() // Uninitialize if there are no more subscribers
      }
    }
  }

  emit (data: T) {
    for (const callback of this.callbacks) {
      callback(data)
    }
  }
}

export default EventEmitter
