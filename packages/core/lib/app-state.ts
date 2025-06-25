export type AppState = 'starting' | 'navigating' | 'settling' | 'ready'

let appState: AppState = 'starting'

export function getAppState (): AppState {
  return appState
}

export function setAppState (newState: AppState): void {
  appState = newState
}
