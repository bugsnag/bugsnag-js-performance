import {
  type BackgroundingListener,
  type BackgroundingListenerCallback
} from '@bugsnag/js-performance-core'

class ControllableBackgroundingListener implements BackgroundingListener {
  private callbacks: BackgroundingListenerCallback[] = []

  onStateChange (callback: BackgroundingListenerCallback) {
    this.callbacks.push(callback)
  }

  sendToBackground () {
    for (const backgroundingListenerCallback of this.callbacks) {
      backgroundingListenerCallback('in-background')
    }
  }

  sendToForeground () {
    for (const backgroundingListenerCallback of this.callbacks) {
      backgroundingListenerCallback('in-foreground')
    }
  }
}

export default ControllableBackgroundingListener
