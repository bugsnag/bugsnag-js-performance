import type {
  BackgroundingListener,
  BackgroundingListenerCallback,
  BackgroundingListenerState
} from '@bugsnag/core-performance'
import type { AppStateStatic, AppStateStatus } from 'react-native'

export default function createBrowserBackgroundingListener (appState: AppStateStatic) {
  const callbacks: BackgroundingListenerCallback[] = []
  let state: BackgroundingListenerState =
  // on iOS the app state may be 'unknown' on launch, so we treat this as 'in-foreground'
    appState.currentState === 'active' || appState.currentState === 'unknown'
      ? 'in-foreground'
      : 'in-background'

  const backgroundingListener: BackgroundingListener = {
    onStateChange (backgroundingListenerCallback: BackgroundingListenerCallback): void {
      callbacks.push(backgroundingListenerCallback)

      // trigger the callback immediately if the app is already in the background
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

  appState.addEventListener('change', (state: AppStateStatus) => {
    const newState = state === 'active' || appState.currentState === 'unknown'
      ? 'in-foreground'
      : 'in-background'

    backgroundStateChanged(newState)
  })

  return backgroundingListener
}
