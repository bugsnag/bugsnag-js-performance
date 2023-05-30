import {
  type BackgroundingListener,
  type BackgroundingListenerCallback
} from '@bugsnag/core-performance'

interface DocumentForVisibilityState {
  addEventListener: (event: string, callback: () => void) => void
  visibilityState: string
}

export default function createBrowserBackgroundingListener (document: DocumentForVisibilityState) {
  const callbacks: BackgroundingListenerCallback[] = []

  const backgroundingListener: BackgroundingListener = {
    onStateChange (backgroundingListenerCallback: BackgroundingListenerCallback): void {
      callbacks.push(backgroundingListenerCallback)

      // trigger the callback immediately if the document is already 'hidden'
      if (document.visibilityState === 'hidden') {
        backgroundingListenerCallback('in-background')
      }
    }
  }

  document.addEventListener('visibilitychange', function () {
    const state = document.visibilityState === 'hidden'
      ? 'in-background'
      : 'in-foreground'

    for (const callback of callbacks) {
      callback(state)
    }
  })

  return backgroundingListener
}
