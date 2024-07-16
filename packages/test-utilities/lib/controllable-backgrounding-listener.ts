import type { BackgroundingListenerState, BackgroundingListener, BackgroundingListenerCallback } from '@bugsnag/core-performance'

class ControllableBackgroundingListener implements BackgroundingListener {
  private state: BackgroundingListenerState = 'in-foreground'
  private callbacks: BackgroundingListenerCallback[] = []

  onStateChange (callback: BackgroundingListenerCallback) {
    this.callbacks.push(callback)
    if (this.state === 'in-background') callback(this.state)
  }

  sendToBackground () {
    this.state = 'in-background'
    for (const backgroundingListenerCallback of this.callbacks) {
      backgroundingListenerCallback(this.state)
    }
  }

  sendToForeground () {
    this.state = 'in-foreground'
    for (const backgroundingListenerCallback of this.callbacks) {
      backgroundingListenerCallback(this.state)
    }
  }
}

export default ControllableBackgroundingListener
