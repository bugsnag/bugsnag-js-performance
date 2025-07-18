import type {
  BackgroundingListener,
  BackgroundingListenerCallback,
  BackgroundingListenerState
} from '@bugsnag/core-performance'
import type { AppStateStatic, AppStateStatus } from 'react-native'

export default function createBrowserBackgroundingListener (appState: AppStateStatic) {
  const callbacks: BackgroundingListenerCallback[] = []
  let state: BackgroundingListenerState = 'in-foreground'
  let appStartInitialStateTimeout: ReturnType<typeof setTimeout> | null = null

  if (appState.currentState === 'background') {
    // if the app is in the background on startup, we add a small delay before we consider it to be "in the
    // background" to allow the app to finish starting up and come into the foreground.
    appStartInitialStateTimeout = setTimeout(() => {
      backgroundStateChanged('in-background')
      appStartInitialStateTimeout = null
    }, 700)
  }

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
    if (appStartInitialStateTimeout !== null) {
      clearTimeout(appStartInitialStateTimeout)
      appStartInitialStateTimeout = null
    }

    const newState = state === 'active' || appState.currentState === 'unknown'
      ? 'in-foreground'
      : 'in-background'

    backgroundStateChanged(newState)
  })

  return backgroundingListener
}
