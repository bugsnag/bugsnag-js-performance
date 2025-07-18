import createBrowserBackgroundingListener from '../lib/backgrounding-listener'
import { AppState } from 'react-native'
import type { AppStateStatus } from 'react-native'

describe('React Native BackgroundingListener', () => {
  const setAppState = (status: AppStateStatus) => {
    // @ts-expect-error we add this in our RN mock
    AppState.bugsnagChangeAppStateStatus(status)
  }

  // Mock timers for debouncing tests
  beforeEach(() => {
    setAppState('active')
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('calls the registered callback after debounce when app state status is "background" on registration', () => {
    const onStateChangeCallback = jest.fn()

    setAppState('background')
    const listener = createBrowserBackgroundingListener(AppState)

    expect(onStateChangeCallback).not.toHaveBeenCalled()

    listener.onStateChange(onStateChangeCallback)

    // Should be called after the 700ms debounce
    expect(onStateChangeCallback).not.toHaveBeenCalled()
    jest.advanceTimersByTime(700)
    expect(onStateChangeCallback).toHaveBeenCalledWith('in-background')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)
  })

  it.each<AppStateStatus>(['active', 'inactive', 'unknown'])('does not call the registered callback immediately when app state status is "%s" on registration', (status: AppStateStatus) => {
    setAppState(status)

    const onStateChangeCallback = jest.fn()
    const listener = createBrowserBackgroundingListener(AppState)

    expect(onStateChangeCallback).not.toHaveBeenCalled()

    listener.onStateChange(onStateChangeCallback)

    expect(onStateChangeCallback).not.toHaveBeenCalled()
    jest.advanceTimersByTime(800) // Advance timers to ensure no debounced calls happen
    expect(onStateChangeCallback).not.toHaveBeenCalled()
  })

  it.each<AppStateStatus>(['background', 'inactive'])('calls the registered callback with "in-foreground" when app state status changes from "%s" to "active"', (status: AppStateStatus) => {
    const onStateChangeCallback = jest.fn()

    const listener = createBrowserBackgroundingListener(AppState)
    listener.onStateChange(onStateChangeCallback)

    expect(onStateChangeCallback).not.toHaveBeenCalled()

    setAppState(status)
    // State changes are immediate (not debounced) after initial setup
    expect(onStateChangeCallback).toHaveBeenCalledWith('in-background')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)

    setAppState('active')
    // Foreground changes happen immediately
    expect(onStateChangeCallback).toHaveBeenCalledWith('in-foreground')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(2)
  })

  it.each<AppStateStatus>(['background', 'inactive'])('calls the registered callback with "in-background" when app state status changes from "active" to "%s"', (status: AppStateStatus) => {
    const onStateChangeCallback = jest.fn()

    const listener = createBrowserBackgroundingListener(AppState)
    listener.onStateChange(onStateChangeCallback)

    expect(onStateChangeCallback).not.toHaveBeenCalled()

    setAppState(status)
    // State changes are immediate (not debounced) after initial setup
    expect(onStateChangeCallback).toHaveBeenCalledWith('in-background')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)
  })

  it('does not call the registered callback when the app state changes from "inactive" to "background"', () => {
    const onStateChangeCallback = jest.fn()

    const listener = createBrowserBackgroundingListener(AppState)
    listener.onStateChange(onStateChangeCallback)

    expect(onStateChangeCallback).not.toHaveBeenCalled()

    setAppState('inactive')
    // State changes are immediate (not debounced) after initial setup
    expect(onStateChangeCallback).toHaveBeenCalledWith('in-background')

    setAppState('background')
    // Should not call again since we're already in background state
    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)
  })
})
