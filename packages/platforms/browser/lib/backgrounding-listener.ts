import type { BackgroundingListener, BackgroundingListenerCallback, BackgroundingListenerState } from '@bugsnag/core-performance'

interface DocumentForVisibilityState {
  addEventListener: (event: string, callback: () => void) => void
  visibilityState: string
}

interface WindowWithDocumentForVisibilityState {
  document: DocumentForVisibilityState
  addEventListener: (event: string, callback: () => void) => void
}

export default function createBrowserBackgroundingListener (window: WindowWithDocumentForVisibilityState) {
  const callbacks: BackgroundingListenerCallback[] = []
  let state: BackgroundingListenerState = window.document.visibilityState === 'hidden'
    ? 'in-background'
    : 'in-foreground'

  const backgroundingListener: BackgroundingListener = {
    onStateChange (backgroundingListenerCallback: BackgroundingListenerCallback): void {
      callbacks.push(backgroundingListenerCallback)

      // trigger the callback immediately if the document is already 'hidden'
      if (state === 'in-background') {
        backgroundingListenerCallback(state)
      }
    }
  }

  const backgroundStateChanged = (newState: BackgroundingListenerState) => {
    if (state === newState) return

    state = newState
    for (const callback of callbacks) {
      callback(state)
    }
  }

  window.document.addEventListener('visibilitychange', function () {
    const newState = window.document.visibilityState === 'hidden'
      ? 'in-background'
      : 'in-foreground'

    backgroundStateChanged(newState)
  })

  // some browsers don't fire the visibilitychange event when the page is suspended,
  // so we also listen for pagehide and pageshow events
  window.addEventListener('pagehide', function () {
    backgroundStateChanged('in-background')
  })

  window.addEventListener('pageshow', function () {
    backgroundStateChanged('in-foreground')
  })

  return backgroundingListener
}
