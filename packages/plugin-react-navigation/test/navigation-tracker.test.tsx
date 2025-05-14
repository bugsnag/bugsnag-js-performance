import type { AppState } from '@bugsnag/core-performance'
import { MockReactNativeSpanFactory } from '@bugsnag/js-performance-test-utilities'
import type { ReactNativeSpanFactory } from '@bugsnag/react-native-performance'
import { NavigationTracker } from '../lib/navigation-tracker'
import type { NavigationContainerRef } from '@react-navigation/native'

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

let appState: AppState = 'starting'

const mockNavigationContainerRef = () => {
  const unsafeActionListeners: Array<(event: any) => void> = []
  const stateChangeListeners: Array<() => void> = []

  let currentRoute: { name: string } = { name: 'initial-route' }

  return {
    addListener: (eventName: string, listener: () => void) => {
      if (eventName === 'state') {
        stateChangeListeners.push(listener)
      } else if (eventName === '__unsafe_action__') {
        unsafeActionListeners.push(listener)
      }
    },
    changeRoute: (routename: string) => {
      currentRoute = { name: routename }
    },
    getCurrentRoute: () => currentRoute,
    triggerStateChange: () => {
      stateChangeListeners.forEach((listener) => { listener() })
    },
    triggerUnsafeAction: (noop = false) => {
      unsafeActionListeners.forEach((listener) => { listener({ data: { action: { type: 'NAVIGATION' }, noop } }) })
    }
  }
}

describe('NavigationTracker', () => {
  it('Creates a navigation span when the currentRoute changes', () => {
    const setAppState = jest.fn((state: AppState) => { appState = state })
    const spanFactory = new MockReactNativeSpanFactory()

    const mockNavigationContainer = mockNavigationContainerRef()
    const navigationTracker = new NavigationTracker(spanFactory as unknown as ReactNativeSpanFactory, setAppState)
    navigationTracker.configure(mockNavigationContainer as unknown as NavigationContainerRef<ReactNavigation.RootParamList>)

    expect(appState).toBe('starting')

    // TODO: Initial route should not create a span??

    // Simulate a route change
    mockNavigationContainer.changeRoute('route-1')
    mockNavigationContainer.triggerUnsafeAction()
    jest.advanceTimersByTime(1)
    mockNavigationContainer.triggerStateChange()

    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('route-1', { isFirstClass: true, startTime: 0, doNotDelegateToNativeSDK: true })

    expect(setAppState).toHaveBeenCalled()
    expect(appState).toBe('navigating')

    // Await the navigation span to end
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).toHaveBeenCalledTimes(1)
    expect(appState).toBe('ready')

    // Navigation span has expected attributes
    const span = spanFactory.createdSpans[0]
    expect(span.name).toEqual('[Navigation]route-1')
    expect(span.startTime).toEqual(0)
    expect(span.endTime).toEqual(1)
    expect(span).toHaveAttribute('bugsnag.span.category', 'navigation')
    expect(span).toHaveAttribute('bugsnag.span.first_class', true)
    expect(span).toHaveAttribute('bugsnag.navigation.route', 'route-1')
    expect(span).toHaveAttribute('bugsnag.navigation.ended_by', 'immediate')
    expect(span).toHaveAttribute('bugsnag.navigation.triggered_by', '@bugsnag/plugin-react-navigation-performance')
  })

  it('Discards the active navigation span when the route changes', () => {
    const spanFactory = new MockReactNativeSpanFactory()
    const setAppState = jest.fn((state: AppState) => {
      appState = state
    })

    const mockNavigationContainer = mockNavigationContainerRef()
    const navigationTracker = new NavigationTracker(spanFactory as unknown as ReactNativeSpanFactory, setAppState)
    navigationTracker.configure(mockNavigationContainer as unknown as NavigationContainerRef<ReactNavigation.RootParamList>)

    // Change to a new route
    mockNavigationContainer.changeRoute('route-1')
    mockNavigationContainer.triggerUnsafeAction()
    mockNavigationContainer.triggerStateChange()

    expect(spanFactory.startNavigationSpan).toHaveBeenCalledTimes(1)
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('route-1', { isFirstClass: true, startTime: 0, doNotDelegateToNativeSDK: true })

    expect(setAppState).toHaveBeenCalled()
    expect(appState).toBe('navigating')

    // Change to a second route while the first navigation span is still open
    jest.advanceTimersByTime(50)
    mockNavigationContainer.changeRoute('route-2')
    mockNavigationContainer.triggerUnsafeAction()
    mockNavigationContainer.triggerStateChange()

    expect(spanFactory.startNavigationSpan).toHaveBeenCalledTimes(2)
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('route-2', { isFirstClass: true, startTime: 50, doNotDelegateToNativeSDK: true })

    // End the navigation
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).toHaveBeenCalled()

    // Only the second route should have been recorded
    expect(spanFactory.createdSpans).toHaveLength(1)
    const secondRouteSpan = spanFactory.createdSpans[0]
    expect(secondRouteSpan.name).toEqual('[Navigation]route-2')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.span.category', 'navigation')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.span.first_class', true)
    expect(secondRouteSpan).toHaveAttribute('bugsnag.navigation.route', 'route-2')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.navigation.previous_route', 'route-1')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.navigation.ended_by', 'immediate')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.navigation.triggered_by', '@bugsnag/plugin-react-navigation-performance')
  })

  it('Prevents a navigation span from ending when navigation is blocked', () => {
    const spanFactory = new MockReactNativeSpanFactory()
    const setAppState = jest.fn((state: AppState) => {
      appState = state
    })

    const mockNavigationContainer = mockNavigationContainerRef()
    const navigationTracker = new NavigationTracker(spanFactory as unknown as ReactNativeSpanFactory, setAppState)
    navigationTracker.configure(mockNavigationContainer as unknown as NavigationContainerRef<ReactNavigation.RootParamList>)

    // Start a navigation
    mockNavigationContainer.changeRoute('route-1')
    mockNavigationContainer.triggerUnsafeAction()
    mockNavigationContainer.triggerStateChange()
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('route-1', { isFirstClass: true, startTime: 0, doNotDelegateToNativeSDK: true })

    expect(setAppState).toHaveBeenCalled()
    expect(appState).toBe('navigating')

    // Prevent navigation from ending
    navigationTracker.blockNavigationEnd()

    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).not.toHaveBeenCalled()

    // Unblock navigation
    navigationTracker.unblockNavigationEnd('condition')
    expect(spanFactory.endSpan).not.toHaveBeenCalled()
    expect(appState).toBe('navigating')

    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).toHaveBeenCalled()
    expect(appState).toBe('ready')

    const secondRouteSpan = spanFactory.createdSpans[0]
    expect(spanFactory.createdSpans).toHaveLength(1)
    expect(secondRouteSpan.name).toEqual('[Navigation]route-1')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.span.category', 'navigation')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.span.first_class', true)
    expect(secondRouteSpan).toHaveAttribute('bugsnag.navigation.ended_by', 'condition')
  })

  it('Does not end a navigation span while multiple components are blocking', () => {
    const spanFactory = new MockReactNativeSpanFactory()
    const setAppState = jest.fn((state: AppState) => {
      appState = state
    })

    const mockNavigationContainer = mockNavigationContainerRef()
    const navigationTracker = new NavigationTracker(spanFactory as unknown as ReactNativeSpanFactory, setAppState)
    navigationTracker.configure(mockNavigationContainer as unknown as NavigationContainerRef<ReactNavigation.RootParamList>)

    // Start a navigation
    mockNavigationContainer.changeRoute('route-1')
    mockNavigationContainer.triggerUnsafeAction()
    mockNavigationContainer.triggerStateChange()

    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('route-1', { isFirstClass: true, startTime: 0, doNotDelegateToNativeSDK: true })
    expect(setAppState).toHaveBeenCalled()
    expect(appState).toBe('navigating')

    // Block navigation from completing
    navigationTracker.blockNavigationEnd()
    navigationTracker.blockNavigationEnd()
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).not.toHaveBeenCalled()
    expect(appState).toBe('navigating')

    // Only unblock one component
    navigationTracker.unblockNavigationEnd('mount')
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).not.toHaveBeenCalled()
    expect(appState).toBe('navigating')

    // The navigation span should not end until all components have unblocked
    navigationTracker.unblockNavigationEnd('mount')
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).toHaveBeenCalled()
    expect(appState).toBe('ready')
    const span = spanFactory.createdSpans[0]
    expect(span.name).toEqual('[Navigation]route-1')
    expect(span).toHaveAttribute('bugsnag.navigation.ended_by', 'mount')
    expect(span.startTime).toEqual(0)
    expect(span.endTime).toEqual(200)
  })
})
