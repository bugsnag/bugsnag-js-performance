export interface Subscription {
  unsubscribe: () => void
}

class EventEmitter<T> {
  private callbacks: Array<(data: T) => void> = []
  private uninitalize?: () => void

  constructor (private initialize?: () => (() => void)) {}

  subscribe (callback: (data: T) => void): Subscription {
    // initialize the event emitter on first subscription
    if (!this.callbacks.length && this.initialize) {
      this.uninitalize = this.initialize() || undefined
    }

    this.callbacks.push(callback)

    return {
      unsubscribe: () => {
        this.callbacks = this.callbacks.filter((other) => callback !== other)
        if (!this.callbacks.length) this.uninitalize?.() // Uninitialize if there are no more subscribers
      }
    }
  }

  emit (data: T) {
    this.callbacks.forEach((callback) => {
      callback(data)
    })
  }
}

export default EventEmitter
