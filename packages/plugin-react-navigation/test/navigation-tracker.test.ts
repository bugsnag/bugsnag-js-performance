import { NavigationTracker } from '../lib/navigation-tracker'
import type { NavigationContainerRef } from '@react-navigation/native'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import * as AppState from '@bugsnag/core-performance/lib/app-state'
import type { MockReactNativeSpanFactory } from '@bugsnag/js-performance-test-utilities'

jest.spyOn(AppState, 'setAppState')

// @ts-expect-error spanFactory only exists in the mock
const spanFactory = BugsnagPerformance.spanFactory as MockReactNativeSpanFactory

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  AppState.setAppState('starting')
  spanFactory.reset()
  jest.clearAllMocks()
  jest.useRealTimers()
})

const mockNavigationContainerRef = () => {
  const unsafeActionListeners: Array<(event: any) => void> = []
  const stateChangeListeners: Array<() => void> = []

  let currentRoute: { name: string } = { name: 'initial-route' }

  return {
    addListener: jest.fn((eventName: string, listener: () => void) => {
      if (eventName === 'state') {
        stateChangeListeners.push(listener)
      } else if (eventName === '__unsafe_action__') {
        unsafeActionListeners.push(listener)
      }
    }),
    changeRoute: jest.fn((routename: string) => {
      currentRoute = { name: routename }
    }),
    getCurrentRoute: jest.fn(() => currentRoute),
    isReady: jest.fn(() => true),
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
    const mockNavigationContainer = mockNavigationContainerRef()
    const navigationTracker = new NavigationTracker()
    navigationTracker.configure(mockNavigationContainer as unknown as NavigationContainerRef<ReactNavigation.RootParamList>)

    expect(AppState.getAppState()).toBe('starting')

    // Simulate a route change
    mockNavigationContainer.changeRoute('route-1')
    mockNavigationContainer.triggerUnsafeAction()
    jest.advanceTimersByTime(1)
    mockNavigationContainer.triggerStateChange()

    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledWith('route-1', { startTime: 0 })

    expect(AppState.setAppState).toHaveBeenCalled()
    expect(AppState.getAppState()).toBe('navigating')

    // Await the navigation span to end
    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).toHaveBeenCalledTimes(1)
    expect(AppState.getAppState()).toBe('ready')

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
    const mockNavigationContainer = mockNavigationContainerRef()
    const navigationTracker = new NavigationTracker()
    navigationTracker.configure(mockNavigationContainer as unknown as NavigationContainerRef<ReactNavigation.RootParamList>)

    // Change to a new route
    mockNavigationContainer.changeRoute('route-1')
    mockNavigationContainer.triggerUnsafeAction()
    mockNavigationContainer.triggerStateChange()

    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledTimes(1)
    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledWith('route-1', { startTime: 0 })

    expect(AppState.setAppState).toHaveBeenCalled()
    expect(AppState.getAppState()).toBe('navigating')

    // Change to a second route while the first navigation span is still open
    jest.advanceTimersByTime(50)
    mockNavigationContainer.changeRoute('route-2')
    mockNavigationContainer.triggerUnsafeAction()
    mockNavigationContainer.triggerStateChange()

    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledTimes(2)
    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledWith('route-2', { startTime: 50 })

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
    const mockNavigationContainer = mockNavigationContainerRef()
    const navigationTracker = new NavigationTracker()
    navigationTracker.configure(mockNavigationContainer as unknown as NavigationContainerRef<ReactNavigation.RootParamList>)

    // Start a navigation
    mockNavigationContainer.changeRoute('route-1')
    mockNavigationContainer.triggerUnsafeAction()
    mockNavigationContainer.triggerStateChange()
    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledWith('route-1', { startTime: 0 })

    expect(AppState.setAppState).toHaveBeenCalled()
    expect(AppState.getAppState()).toBe('navigating')

    // Prevent navigation from ending
    navigationTracker.blockNavigationEnd()

    jest.advanceTimersByTime(100)
    expect(spanFactory.endSpan).not.toHaveBeenCalled()

    // Unblock navigation
    navigationTracker.unblockNavigationEnd('condition')

    expect(spanFactory.endSpan).not.toHaveBeenCalled()
    expect(AppState.getAppState()).toBe('navigating')

    jest.advanceTimersByTime(100)

    expect(spanFactory.endSpan).toHaveBeenCalled()
    expect(AppState.getAppState()).toBe('ready')

    const secondRouteSpan = spanFactory.createdSpans[0]

    expect(spanFactory.createdSpans).toHaveLength(1)
    expect(secondRouteSpan.name).toEqual('[Navigation]route-1')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.span.category', 'navigation')
    expect(secondRouteSpan).toHaveAttribute('bugsnag.span.first_class', true)
    expect(secondRouteSpan).toHaveAttribute('bugsnag.navigation.ended_by', 'condition')
  })

  it('Does not end a navigation span while multiple components are blocking', () => {
    const mockNavigationContainer = mockNavigationContainerRef()
    const navigationTracker = new NavigationTracker()
    navigationTracker.configure(mockNavigationContainer as unknown as NavigationContainerRef<ReactNavigation.RootParamList>)

    // Start a navigation
    mockNavigationContainer.changeRoute('route-1')
    mockNavigationContainer.triggerUnsafeAction()
    mockNavigationContainer.triggerStateChange()

    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledWith('route-1', { startTime: 0 })
    expect(AppState.setAppState).toHaveBeenCalled()
    expect(AppState.getAppState()).toBe('navigating')

    // Block navigation from completing
    navigationTracker.blockNavigationEnd()
    navigationTracker.blockNavigationEnd()
    jest.advanceTimersByTime(100)

    expect(spanFactory.endSpan).not.toHaveBeenCalled()
    expect(AppState.getAppState()).toBe('navigating')

    // Only unblock one component
    navigationTracker.unblockNavigationEnd('mount')
    jest.advanceTimersByTime(100)

    expect(spanFactory.endSpan).not.toHaveBeenCalled()
    expect(AppState.getAppState()).toBe('navigating')

    // The navigation span should not end until all components have unblocked
    navigationTracker.unblockNavigationEnd('mount')
    jest.advanceTimersByTime(100)

    expect(spanFactory.endSpan).toHaveBeenCalled()
    expect(AppState.getAppState()).toBe('ready')

    const span = spanFactory.createdSpans[0]
    expect(span.name).toEqual('[Navigation]route-1')
    expect(span).toHaveAttribute('bugsnag.navigation.ended_by', 'mount')
    expect(span.startTime).toEqual(0)
    expect(span.endTime).toEqual(200)
  })

  it('handles noop navigation actions', () => {
    const mockNavigationContainer = mockNavigationContainerRef()
    const navigationTracker = new NavigationTracker()
    navigationTracker.configure(mockNavigationContainer as unknown as NavigationContainerRef<ReactNavigation.RootParamList>)

    mockNavigationContainer.triggerUnsafeAction(true) // noop = true
    mockNavigationContainer.triggerStateChange()

    expect(BugsnagPerformance.startNavigationSpan).not.toHaveBeenCalled()
  })

  it('handles navigation timeout', () => {
    const mockNavigationContainer = mockNavigationContainerRef()
    const navigationTracker = new NavigationTracker()
    navigationTracker.configure(mockNavigationContainer as unknown as NavigationContainerRef<ReactNavigation.RootParamList>)

    mockNavigationContainer.triggerUnsafeAction()
    jest.advanceTimersByTime(1001) // Exceed NAVIGATION_START_TIMEOUT

    expect(BugsnagPerformance.startNavigationSpan).not.toHaveBeenCalled()

    expect(spanFactory.endSpan).not.toHaveBeenCalled()
  })

  it('handles unready navigation container', () => {
    const mockNavigationContainer = {
      ...mockNavigationContainerRef(),
      isReady: () => false
    }
    const navigationTracker = new NavigationTracker()
    navigationTracker.configure(mockNavigationContainer as unknown as NavigationContainerRef<ReactNavigation.RootParamList>)

    expect(mockNavigationContainer.getCurrentRoute).not.toHaveBeenCalled()
  })
})
